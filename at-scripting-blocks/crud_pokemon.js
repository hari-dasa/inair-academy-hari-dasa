const PokeApi = "https://pokeapi.co/api/v2/";
const table = base.getTable("tblEWHy8pqeEgZKUp");

class PokemonOrchestrator {
    constructor(record) {
        this.record = record;
    }

    async updatePokemon()
    {
        await table.updateRecordAsync(this.record.id, {
            "Name": this.record.name,
        });
    }
    
    async fetchdata(){
        let response = await remoteFetchAsync(`${PokeApi}pokemon/${this.record.name.toLowerCase()}`);
        this.data = await response.json();
        console.log(this.data);
    }
    async process() {
        if(this.record){
            await this.fetchdata();
        }

    }
}

const queryResult = await table.selectRecordsAsync({fields: [table.fields[0]]});
const record = await input.recordAsync("😺 Pick a Pokemón to get details: ", queryResult);
        
const pokemon = new PokemonOrchestrator(record);
await pokemon.process();