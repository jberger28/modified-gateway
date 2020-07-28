/**
 * Manages the connection to the Cassandara server
 *
 * @module Cassie
 */

'use strict';

const Deferred = require('./deferred');
// const cassandra = require('modified-cassandra-driver');
const cassandra = require('cassandra-driver');

/**
 * @class Cassie
 * @classdesc Cassie sets up a Cassandra client and manages
 * the connection to the Cassandra server
 */
class Cassie {

  constructor() {
    this.typeMap = new Map([
      ["boolean", "boolean"],
      ["number", "double"]
      ]);

    this.count = 0; // used to count notifications sent to web app
    this.requests = [] // used to keep track of incoming http request values
    this.notifications = [] // used to keep track of notifications being sent back to web app
    this.intervals = [] // keeps track of time intervals in which Cassandra updates occur

    this.pending = {}; // keepts track of pending delayed executions
    this.finished = []; // keeps track of delayed executions that have already finished

    this.client = new cassandra.Client({ 
      contactPoints: ['45.56.103.71', '172.104.25.116', '50.116.63.121', '172.104.9.37', '23.239.10.53'],
      // contactPoints: ['localhost'],
      localDataCenter: 'datacenter1',
      keyspace: 'iot'
    });

    this.client.connect(function (err) {
      if (err) return console.error(err);
      else console.log('Connected to Cassandra cluster');
    });

    /* COMMENTED OUT FOR BENCHMARK TEST
    // Set up event listener for notification that delayed request has finished executing
    this.client.on('finishedProcessing', (msg) => {
      console.log("DELAYED HAS FINISHED EXECUTING!! " + msg);
      let ts = msg.slice(msg.indexOf(' ') + 1); // the timestamp sent by the server

      // if we know request is pending, resolve corresponding promise
      if (this.pending[ts]) {
        this.pending[ts].resolve();
        delete this.pending[ts];
      } 
      // if we don't know yet, then store the timestamp# in the finished array
      else {
        this.finished.push(ts);
      }
    })
    */
  }

  // Create a table representing the state of a device,
  // and add a row representing the device's initial state
  async initDevice(deviceId, properties) {
    let columnTypes = {}; // a key-value store of <propertyName, CQL type of that property>
    let propValues = {}; // a key-value store of <propertyName, property value>

    deviceId = this.formatId(deviceId.toLowerCase()); // replace dashes with underscores and convert to lowercase

    // fill our data structures with property types and initial values
    for (const propertyName in properties) {
      const propertyDict = properties[propertyName];
      columnTypes[propertyName] = this.typeMap.get(propertyDict.type);
      propValues[propertyName] = propertyDict.value;
    }

    let tableExists;
    try {
      tableExists = (await this.client.metadata.getTable("iot", deviceId)) != null;
      // console.log("Table exists?: " + deviceId + " = " + tableExists);
    }
    catch(err) {
      console.log(err);
    }

    // Create new table, if necessary
    if (!tableExists) {

      // Create the Cassandra table
      let query = 'CREATE TABLE ' + this.inQuotes(deviceId) + ' ( id text PRIMARY KEY,'

      // Add the column names and types to the query
      for (const property in columnTypes) {
        query += ' ' + this.inQuotes(property.toLowerCase()) + ' ' + columnTypes[property] + ',';
      }

      query = query.slice(0, query.length - 1) + " );"
      console.log(query);
      await this.execute(query);
    }

    // Add a row to the table, representing the device's initial state
    let props = 'id, '; // the property names
    let values = "'state', "; // the property values

    // Build comma-separated lists of propertyNames and values, necessary for CQL syntax
    for (const property in propValues) {
      props += this.inQuotes(property.toLowerCase()) + ', ' ;
      values += propValues[property] + ', ';
    }

    props = '(' + props.slice(0, props.length - 2) + ')';
    values = '(' + values.slice(0, values.length - 2) + ')';

    // Execute the INSERT query
    let query = 'INSERT INTO ' + this.inQuotes(deviceId) + '' + props + ' VALUES ' + values + ';';
    this.execute(query);
  }


  // USED FOR BENCHMARK TESTING
  /*
  write(deviceId, propertyName, value) {
    return new Promise((resolve, reject) => {
      // remove dashes and convert to lowercase
      // deviceId = this.inQuotes(this.formatId(deviceId.toLowerCase()));
      deviceId = "smartSwitch";
      propertyName = this.inQuotes(propertyName.toLowerCase());

      // Execute UPDATE query    
      let query = 'UPDATE ' + deviceId + ' SET ' + propertyName + '=' + value + ' WHERE id=\'state\';';

      const interval = {};
      interval.start = Date.now();
      this.execute(query)
      .then(() => {
        interval.finish = Date.now();
        this.intervals.push(interval);
        resolve()
      })
    })
  }
  */

  // Write a property value to Cassandra
  // Modified so that multiple gateways write to same Cassandra server
  write(deviceId, propertyName, value) {
    return new Promise((resolve, reject) => {
      // remove dashes and convert to lowercase
      // deviceId = this.inQuotes(this.formatId(deviceId.toLowerCase()));
      deviceId = 'smart_switch';
      propertyName = this.inQuotes(propertyName.toLowerCase());

      // Execute UPDATE query    
      let query = 'UPDATE ' + deviceId + ' SET ' + propertyName + '=' + value + ' WHERE id=\'state\';';

      this.execute(query)
      .then((result) => {
        if (result.info.warnings && result.info.warnings[0] == "DELAY")
        {
          console.log("REQUEST DELAYED WITH TIMESTAMP: " + result.info.warnings[1]);
          let ts = result.info.warnings[1]; // the timestamp returned by the server
            
          // if execution finished before we got notification that request was delayed
          if (this.finished.includes(ts)) {

            // delete element from array
            let index = this.finished.indexOf(ts);
            this.finished.splice(index, 1);

            resolve();
          } 
          // if execution still pending
          else {
            this.pendingExecution(ts)
            .then(() => 
              resolve())
          }
        }
        else {
          resolve();
        }
      })
    })
  }

    /**
   * @method pendingExecution
   * @returns a promise which is resoved when a delayed
   * query finishes execution
   */
  pendingExecution(ts) {
    const deferred = new Deferred();
    this.pending[ts] = deferred;
    return deferred.promise;
  }

  // Read a property value from Cassandra
  // Modifed for multiple gateways to use same Cassandra server
  async read(deviceId, propertyName) {

    // remove dashes andconvert lowercase
    // deviceId = this.formatId(deviceId.toLowerCase());
    deviceId = 'smart_switch';
    propertyName = propertyName.toLowerCase();

    // execute select query
    let query = 'SELECT ' + this.inQuotes(propertyName) + ' FROM ' + this.inQuotes(deviceId) + ' WHERE id=\'state\';';
    let result = await this.execute(query);

    let row = result.rows[0];
    let value = row[propertyName];
    return value;
  }

  // Execute query and perform error checking
  async execute(query) {
    try {
      let result = await this.client.execute(query);
      // console.log("Query: " + query + "executed successfully");
      return result;
    }
    catch(err) {
      console.log("Error with Cassandra query: " + err);
    }
  }

  // return string argument surrounded by quotes
  inQuotes(str) {
    return '"' + str + '"';
  }

  // Replace dashes with underscores, dashes not allowed in Cassandra table names
  formatId(deviceId) {
    return deviceId.replace(/-/g, '_');
  }
}

module.exports = new Cassie();