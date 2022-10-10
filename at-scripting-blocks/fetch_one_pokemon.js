const PokeApi = "https://pokeapi.co/api/v2/";
const table = base.getTable("tblEWHy8pqeEgZKUp");
let queryResult = await table.selectRecordsAsync({fields: [table.fields[0]]});
let record = await input.recordAsync("😺 Pick a Pokemón to get details: ", queryResult);
if(record){
    let response = await remoteFetchAsync(`${PokeApi}pokemon/${record.name.toLowerCase()}`);
    console.log( await response.json());
}