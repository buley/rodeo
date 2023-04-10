const { Neo4jGraphQL } = require("@neo4j/graphql");
const { toGraphQLTypeDefs } = require("@neo4j/introspector")
const neo4j = require("neo4j-driver");
const fs = require('fs');

const Twokeys = require('twokeys');
const { ApolloServer, gql } = require("apollo-server");

const driver = neo4j.driver(
    "bolt://192.168.1.167:7687",
    neo4j.auth.basic("neo4j", "zedzedzed")
);

const sessionFactory = () => driver.session({ defaultAccessMode: neo4j.session.READ })


//const driver = neo4j.driver('neo4j+s://bf2ca491.databases.neo4j.io', neo4j.auth.basic('neo4j', 'fOqId0iEqAPO-3XX0DMnPLkBMuGY5FdGG_Z9BLHJ3Eo'))
const sessionOptions = {
  database: 'neo4j',
  maxConnectionPoolSize: 64,
  maxConnectionLifetime: 60 * 60 * 1000 * 72, // 72 hours
  connectionAcquisitionTimeout: 100, // 300 seconds
  maxTransactionRetryTime: 100, // 300 seconds
  connectionTimeout: 300000, // 300 seconds
}
const verbose = true;

async function commonRunner(query, data, debug = true, delay = 0) {
  const retryTimeout = 100;
  return new Promise((resolve, reject) => { 
    setTimeout(() => {
      doTryWhile(query, data, retryTimeout, delay, debug).catch(reject).then(resolve);
    }, delay);
  });
}

async function writeNeoIndex(nodeType, indexAttribute, debug) {
  return commonRunner(
    `CREATE CONSTRAINT FOR (n:${nodeType}) REQUIRE n.${indexAttribute} IS UNIQUE`,
    {nodeType, indexAttribute},
    debug
  );
}

async function doTryWhile(query, data, timeout, boff, debug) {
  const maxBackoff = 10;
  var backoff = 1 + boff;
  var increment = function (bkoff) {
    backoff = Math.min(bkoff, maxBackoff);
  };
  return new Promise(function(resolve, reject) {
    async function whilst (err, result) {
      //finally promise function passe
      //the result object as second var (result)
      if (undefined !== err && true !== err.retriable) {
        return reject(err);
      }
      return (undefined === result) ? doTry(query, data, timeout, backoff, increment, debug).then((d) => {
        return whilst(undefined, d);
      }).catch((e) => {
        if (true === e.retriable) {
          increment(backoff);
          return whilst(e, undefined);
        } else {
          reject(e);
        }
      }) : resolve(result);
    }
    //pass a fake object to kickstart
    //then keep going until it throws a result 
    //or a non-retriable error
    return whilst(undefined, undefined);
  });
}

async function doTry(query, data = {}, timeout, backoff, increment, debug) {
  let queryKeys = null;
  return new Promise(function(resolve, reject) {
    if ('' === query 
      || false === query 
      || null === query 
      || undefined === query) {
      reject(new Error('doTry empty query'));
    } else if ('' === data 
      || false === data 
      || null === data 
      || undefined === data) {
      reject(new Error('doTry empty data'));
    } else {
      setTimeout(function() {
        let session = driver.session(sessionOptions)
          node = null,
          collection = [];
        if (debug || verbose) {
          console.log("doTry Data", data, "Query", query);
        }
        try {
          session.run(query, data).subscribe({ 
            onError: (err) => {
              if (debug || verbose) {
                console.log("doTry Error (3)",err, timeout, backoff);
              }
              increment(backoff + 1);
              reject(err);
            },
            onKeys: (keys) => {
              queryKeys = keys;
              console.log("KEYS",queryKeys);
            },
            onNext: (record) => {
              let datum = {
                queryOptions: data
              },
              summary,
                attr;
              for (attr in record._fieldLookup) {
                datum[attr] = record._fields[record._fieldLookup[attr]];
                if ('dataValues' === attr) {
                  summary = new (new Twokeys()).Series({data: datum[attr]}).describe();
                  datum.dataValuesSummary = summary.summary;
                  datum.dataValuesSmooths = summary.smooths;
                  datum.dataValuesTransforms = summary.transforms;
                  datum.dataValuesCounts = summary.counts;
                  datum.dataValuesSorted = summary.sorted;
                  datum.dataValuesRanked = summary.ranked;
                  datum.dataValuesBinned = summary.binned;
                }

              }
              console.log("RECORD!",datum);
              collection.push(datum)
            },
            onCompleted: (result) => {
              if (result) {
                if (debug || verbose) {
                  console.log("doTry result",result, queryKeys, collection);
                }
              }
              increment(backoff + 1);
              resolve(collection);
            }});
        } catch (e2) {
          if (debug || verbose) {
            console.log("doTry err (2)", e2, backoff);
          }
          reject(e2);
        }
      }, timeout * backoff);
    }
  });
}

function buildQuerySync(options = {}) {
  return `MATCH (h:Horse)<-[r:RESULT]-(c:Race)
` + ((!options.raceDistance) ? `` : `WHERE exists((c)-[:DISTANCE]->(:RaceDistance {raceDistance: ` + options.raceDistance + `}))`) + `
` + ((!options.raceClass) ? `` : ((!!options.raceDistance) ? 'AND ' : 'WHERE ' ) + `exists((c)-[:CLASS]->(:RaceClass {raceClass: ` + options.raceClass + `}))`) + `
WITH collect(r.horseTime) as values
UNWIND values AS val 
RETURN values as dataValues,
avg(val) as dataAverage,
max(val) as dataMaximum,
min(val) as dataMinimum,
stDev(val) as dataStandardDeviation,
stDevP(val) as dataStandardDeviationP,
SUM(val) as dataSum,
count(val) as dataCount,
percentileCont(val, .01) as percentileOne,
percentileCont(val, .05) as percentileFive,
percentileCont(val, .1) as percentileTen,
percentileCont(val, .15) as percentileFifteen,
percentileCont(val, .20) as percentileTwenty,
percentileCont(val, .25) as percentileTwentyFive,
percentileCont(val, .30) as percentileThirty,
percentileCont(val, .35) as percentileThirtyFive,
percentileCont(val, .40) as percentileForty,
percentileCont(val, .45) as percentileFortyFive,
percentileCont(val, .50) as percentileFifty,
percentileCont(val, .55) as percentileFiftyFive,
percentileCont(val, .60) as percentileSixty,
percentileCont(val, .65) as percentileSixtyFive,
percentileCont(val, .70) as percentileSeventy,
percentileCont(val, .75) as percentileSeventyFive,
percentileCont(val, .80) as percentileEighty,
percentileCont(val, .85) as percentileEightyFive,
percentileCont(val, .90) as percentileNinety,
percentileCont(val, .91) as percentileNinetyOne,
percentileCont(val, .92) as percentileNinetyTwo,
percentileCont(val, .93) as percentileNinetyThree,
percentileCont(val, .94) as percentileNinetyFour,
percentileCont(val, .95) as percentileNinetyFive,
percentileCont(val, .96) as percentileNinetySix,
percentileCont(val, .97) as percentileNientySeven,
percentileCont(val, .98) as percentileNinetyEight,
percentileCont(val, .99) as percentileNinetyNine,
percentileCont(val, .999) as percentileNinetyNinePointNine`;
}

async function get1000(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 1000;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}


async function get1200(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 1200;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get1400(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 1400;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get1600(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 1600;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get1800(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 1800;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get2000(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 2000;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get2200(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 2200;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get2400(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 2400;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function get2600(options = {}) {
  return new Promise((resolve, reject) => {
    options.raceDistance = 2600;
    commonRunner(buildQuerySync(options), options, options.debug, 0).then(resolve).catch(reject);
  });
}

async function getData(options = {}) {
  let {raceCity, raceClass, raceCountry, raceDistance, raceEventType, raceField, raceName, raceWeather, stable, timeBucket} = options;
  return new Promise((resolve, reject) => {
    let data = [], x, xlen, promises = [];
    switch(raceDistance) {
      case 1000:
        data.push(get1000);
        break;
      case 1200:
        data.push(get1200);
        break;
      case 1400:
        data.push(get1400);
        break;
      case 1600:
        data.push(get1600);
        break;
      case 1800:
        data.push(get1800);
        break;
      case 2000:
        data.push(get2000);
        break;
      case 2200:
        data.push(get2200);
        break;
      case 2400:
        data.push(get2400);
        break;
      case 2600:
        data.push(get2600);
        break;
      default:
        data.push.apply(data, [
          get1000,
          get1200,
          get1400,
          get1600,
          get1800,
          get2000,
          get2200,
          get2400,
          get2600
        ]);
        break;
    }
    xlen = data.length;
    for (x = 0; x < xlen; x += 1) {
      promises.push(data[x](options));
    }
    Promise.all(promises).finally((err, results) => {
      console.log("FINISHED",err,results);
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function main() {
   
    const readonly = false,
      typeDefs = await toGraphQLTypeDefs(sessionFactory, readonly)

    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    neoSchema.getSchema().then((schema) => {
      getData().then((data) => {
        const server = new ApolloServer({
            schema,
        });
        console.log("DATA",data);
        server.listen().then(({ url }) => {
            console.log(`🚀 Server ready at ${url}`);
        }).catch((e) => {
          console.log("APOLLO",e);
        });

      });

      
    })
}

main();