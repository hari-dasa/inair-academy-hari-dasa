const PokeApi = "https://pokeapi.co/api/v2/";
table = base.getTable("Pokémon");
let queryResult = await table.selectRecordsAsync({fields: ['fldVVhJlPT0Pfmwos']});
let record = await input.recordAsync('Pick a Pokemón to get details: ', queryResult);
let response = await remoteFetchAsync(`${PokeApi}pokemon/${record.name.toLowerCase()}`);
console.log( await response.json());