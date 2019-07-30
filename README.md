## This project shares a local chain with another Pact dApp

https://github.com/fmelp/brackets-pact

## Running steps:

once you have the [project linked above](https://github.com/fmelp/brackets-pact) running please follow the next steps

```
npm run pact:seed
```
```
npm start
```

note: this project does not require ```npm run start:pact``` as it initialized in the above github project

seeding the chain is done in load-contract.yaml, where it assumes all the pact code is in a react project in a sibling directory to this one
