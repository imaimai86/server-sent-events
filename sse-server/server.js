const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = 3001;

let clients = [];
const clientMap = new Map();
let facts = [];

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})



// ...

function eventsHandler(request, response, next) {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
  
    const data = `data: ${JSON.stringify(facts)}\n\n`;
  
    response.write(data);
  
    const clientId = request.params.requestId;
  
    const newClient = {
      id: clientId,
      response
    };

    clientMap.set(clientId, newClient);
    clients.push(newClient);
  
    request.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clientMap.delete(clientId);
      clients = clients.filter(client => client.id !== clientId);
    });

    const filename = `Test_${clientId}.log`;
    const path = `./${filename}`;
    //if file does not exists, create it
    if (!fs.existsSync(path)) {
        // fs.writeFileSync(path, '{"info":"Show 1","source":"Anas"}');
    }
    //add contents to the end of the file in a newline
// fs.writeFileSync

    // fs.appendFileSync(path, `\r\n{"info":"Show 1","source":"Anas"}`);
    // fs.appendFileSync(path, `\r\n{"info":"Show 2","source":"Anas"}`);
    // fs.appendFileSync(path, `\r\n{"info":"Show 3","source":"Anas"}`);

    tailFile(clientId, path);
  }
  
  app.get('/events/:requestId', eventsHandler);


  // ...

  function sendEventsToAll(newFact) {
    clients.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
  }

  function sendEventsToClient(clientId, event) {
    const client = clientMap.get(clientId);
    client.response.write(`data: ${JSON.stringify(event)}\n\n`)
  }
  
  async function addFact(request, response, next) {
    const newFact = request.body;
    const clientId = request.params.requestId;
    facts.push(newFact);
    response.json(newFact)
    return sendEventsToAll(newFact);
  }
  
  app.post('/fact/:requestId', addFact);

/**
 * function to tail contents of a file to a client, client is identified by clientId from clientMap, filename is Test_${clientId}.log, End the stream when file returns string ==END==
 */
async function tailFile(clientId, path) {
    // const filename = `Test_${clientId}.log`;
    if (!fs.existsSync(path)) {
      return;
    }
    const fileStream = fs.createReadStream(path)
    const client = clientMap.get(clientId);
    fileStream.on('data', (chunk) => {
      console.log('chunk', new Buffer(chunk).toString('utf8'));
      client.response.write(`data: ${chunk}\n\n`);
    });
    fileStream.on('end', () => {
      client.response.write(`data: {"info":"==END==","source":"Anas"}\n\n`);
      client.response.end();
    });

    // read  from file $path line by line

}
