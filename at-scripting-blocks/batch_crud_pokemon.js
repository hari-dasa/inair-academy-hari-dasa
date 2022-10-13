const PokeApi = "https://pokeapi.co/api/v2/";
const BatchSize = 50;
const table = base.getTable("tblEWHy8pqeEgZKUp");

class PokemonTableDataHandle {
    constructor() {
        this.capitalize();
    }

    async formatData({id, name, height, weight, order, base_experience, stats, game_indices, sprites, types, abilities}){
        return {
            "fldVVhJlPT0Pfmwos":   name,//Name
            "fld9kcvyi56sgcQFV":   height,
            "fldEod3K9mLgRCyCM":   base_experience,
            "fldn8uoefVgtl1Nnq":   weight,
            "fldXACbC5CUSOOQim":   stats[0].base_stat,//HP
            "fldWWpZHzWEiUeIUn":   stats[1].base_stat,//Attack
            "fld2ZG1THHThEwgNQ":   stats[2].base_stat,//Defense
            "fldXbJW0WCbjGjn4e":   order,

            "fldlfBCItws1jDe1n":   this.defineGeneration(id),

            "fldHpDnt5nlwKAUDX":   this.defineGames(game_indices),

            "fldGRP2zf5yCCbE35":    await this.getRecordsIdFromTable(types, 'tblJJmicJsbgIZhit', 'type'),
            "fldZdLOn3yJHggxDV":    await this.getRecordsIdFromTable(abilities, 'tblwx7HWRqtU57KQj', 'ability'),

            "fldPXZI7TaZgHL2zr":    this.getAttachs(sprites),
        };
    }

    getRecordsIdFromFilter(records, types, field)
    {
        let recordsIds = [];
        for(var x = 0; x < types.length; x++) {
            let right  = records.length - 1;
            let left = 0;
            let middle = 0;

            while(left <= right){
                middle = Math.floor((left+right) / 2);

                if (records[middle].name.toLowerCase() == types[x][field].name){
                    recordsIds.push({ id: records[middle].id});//add the id to a array like choices
                    types.slice(x, 1)//
                    break;
                }else if(records[middle].name.toLowerCase()  < types[x][field].name){
                    left = middle + 1;//error, i cannot sum the value inside this loop
                } else {
                    right = middle - 1;
                }
            }
        
        }
        return recordsIds;
    }

    async getRecordsIdFromTable(abilities, tableName, attributeName){
        const table = base.getTable(tableName);
        const queryResult = await table.selectRecordsAsync({
            fields: ["Name"],
            sorts: [
                {field: "Name"},
            ]
        });

        const recordsIds = this.getRecordsIdFromFilter( queryResult.records, abilities, attributeName)
        return recordsIds; 
    }

    getAttachs(sprites){
        const attachments = [] ;
        const keys = Object.keys(sprites);
        for(let i=0; i< keys.length; i++){
            if(attachments.length == 2)
                break;
                
            if(sprites[keys[i]] && typeof(sprites[keys[i]]) === 'string')
                attachments.push({url: sprites[keys[i]]});
        }

        return attachments;
    }

    defineGeneration(id)
    {
        if (id <= 151)
            return {name: 'Generation I'};

        return {name: 'Generation II'};
    }

    defineGames(games)
    {
        const choices = [] ;
        for(let i=0; i< games.length; i++){
            if(i >= 4)
                break;
            choices.push({name: games[i].version.name.capitalize()});
        }
        
        return choices;
    }

    capitalize(){
        Object.defineProperty(String.prototype, 'capitalize', {
            value: function() {
                return this.charAt(0).toUpperCase() + this.slice(1);
            },
            enumerable: false
        });
    }
}

class PokemonOrchestrator {
    constructor() {
        this.dataHandler = new PokemonTableDataHandle();
    }

    // async handleBatchPokemons(records)
    // {
    //     let formatedPokemons = [];
    //     for (let x = 0; x < records.length; x++) {
    //         formatedPokemons.push(await this.dataHandler.formatData(records[x]));//instead of pushing I could just replace from the given index
    //     }
    //     return formatedPokemons;
    // }

    async getRecords()
    {
        const query = await table.selectRecordsAsync({fields: [table.fields[0]]});
        return query.records;
    }

    async deleteRecords()
    {
        output.markdown("### \u{1F580} First step, delete all record from Pokémon table:  ");
        let records = await this.getRecords();
        if(records)
          while (records.length > 0) {
              await table.deleteRecordsAsync(records.slice(0, BatchSize));
              records = records.slice(BatchSize);
          }
    }

    async createPokemons()
    {
        if(this.fetchedPokemons){
            output.markdown(`### \u{1F648} Create ${BatchSize} Pokemóns records: `);
            while (this.fetchedPokemons.length > 0) {
                await table.createRecordsAsync(this.fetchedPokemons.slice(0, BatchSize));
                this.fetchedPokemons = this.fetchedPokemons.slice(BatchSize);
            }
        }
    }

    async fetchUrlPokemonsId(limit = 251)
    {
        output.markdown("### \u{1F648} Get Pokemón Urls to fetch later: ");
        const response   = await remoteFetchAsync(`${PokeApi}pokemon?limit=${limit}`);
        this.pokemonsUrl = (await response.json()).results;
        console.log(this.pokemonsUrl);
    }
    
    async fetchBatchPokemons(){
        this.fetchedPokemons = [];

        output.markdown(`### \u{1F648} Fetch ${BatchSize} Pokemóns and format: `);
        for (let x = 0; x < BatchSize; x++) {
            if(this.pokemonsUrl[x]) {
                const response = await remoteFetchAsync(this.pokemonsUrl[x].url);
                const payload = await response.json();
                if(payload) {
                    this.fetchedPokemons.push(await this.dataHandler.formatData(payload));
                }
            }
        }
        this.pokemonsUrl = this.pokemonsUrl.slice(this.fetchedPokemons.length);
        // console.log('this.pokemonsUrl ', this.pokemonsUrl);
        // console.log('this.fetchedPokemons ', this.fetchedPokemons );
    }

    async createFetchedPokemons()
    {
        while(this.pokemonsUrl.length > 202)
        {
            await this.fetchBatchPokemons();
            await this.createPokemons();
        }
    }

    async process() {
        await this.deleteRecords();
        await this.fetchUrlPokemonsId();
        await this.createFetchedPokemons();
    }
}

// const queryResult = await table.selectRecordsAsync({fields: [table.fields[0]]});
// const record = await input.recordAsync("😺 Pick a Pokemón to get details: ", queryResult);
        
const pokemon = new PokemonOrchestrator();
await pokemon.process();
// await pokemon.fetchUrlPokemonsId();
// await  pokemon.fetchBatchPokemons();


