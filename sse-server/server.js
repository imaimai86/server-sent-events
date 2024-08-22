const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

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

