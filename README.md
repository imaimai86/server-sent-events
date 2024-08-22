* Start server:
  * ```npm run dev```

* Start client:
  * ```npm start```

* Push messages:
```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"info": "Show 3", "source": "Anas"}'\
  -s http://localhost:3001/fact/1724313552552
```