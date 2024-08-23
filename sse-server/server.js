const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const { processLineByLine } = require("./utils");
const Tail = require("tail").Tail;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 3001;

const clientMap = new Map();

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`);
});

app.get("/status", (request, response, next) =>
  response.json({ clients: clientMap.size })
);

async function eventsHandler(request, response, next) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  response.writeHead(200, headers);

  const clientId = request.params.requestId;
  console.log(`${clientId} Connection opened`);

  const filename = `Test_${clientId}.log`;
  const path = `./logs/${filename}`;
  fs.writeFileSync(path, `STARTS HERE\n`);

  const logWatch = await watchLogFile(clientId, path);

  const newClient = {
    id: clientId,
    response,
    logWatch,
  };

  clientMap.set(clientId, newClient);
  console.log("Number of connections", clientMap.size, clientMap.keys());

  request.on("close", () => {
    const client = clientMap.get(clientId);
    if (!!client) {
      !!client.response && client.response.end();
      !!client.logWatch && client.logWatch.unwatch();
      clientMap.delete(clientId);
      console.log("Number of connections", clientMap.size);
    }
  });
}

app.get("/events/:requestId", eventsHandler);

async function sendEventsToClient(clientId, event) {
  const client = clientMap.get(clientId);
  console.log("clientMap RETRIEVED", !!client);
  if (!event || !event.length) {
    return;
  }

  console.log("Send DATA", event);
  client.response.write(`data: {"info":"${event}","source":"Anas"}\n\n`);
}

async function watchLogFile(clientId, path) {
  const tail = new Tail(path, { fromBeginning: true });

  tail.on("line", async (data) => {
    if (!data) return;
    // console.log('clientId', clientId);
    // await sendEventsToClient(clientId, data);
    console.log("On line", data);
    sendEventsToClient(clientId, data);
  });

  tail.on("error", (error) => {
    console.log("error", error);
  });

  tail.watch();

  return tail;
}
