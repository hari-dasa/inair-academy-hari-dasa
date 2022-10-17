const PokeApi = "https://pokeapi.co/api/v2/";
const BatchSize = 50;
const table = base.getTable("tblEWHy8pqeEgZKUp");

class PokemonTableDataHandle {
    constructor([abilitieRecords, typesRecords]) {
       this.typesRecords = typesRecords;
       this.abilitieRecords = abilitieRecords;
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

            "fldGRP2zf5yCCbE35":    await this.getRecordsIdFromTable(types, 'type'),
            "fldZdLOn3yJHggxDV":    await this.getRecordsIdFromTable(abilities, 'ability'),

            "fldPXZI7TaZgHL2zr":     this.getSprites(Object.values(sprites)),
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
                    recordsIds.push({ id: records[middle].id});
                    types.slice(x, 1)//
                    break;
                }else if(records[middle].name.toLowerCase()  < types[x][field].name){
                    left = middle + 1;
                } else {
                    right = middle - 1;
                }
            }
        
        }
        return recordsIds;
    }

    async getRecordsIdFromTable(abilities, attributeName){

        if(attributeName == "ability")
            return this.getRecordsIdFromFilter( this.abilitieRecords, abilities, attributeName)

        if(attributeName == "type")
            return this.getRecordsIdFromFilter( this.typesRecords, abilities, attributeName)
    }

    getSprites(sprites){
        return sprites.reduce(function(result, sprite) {
                    if(typeof(sprite === 'string') && sprite) 
                        result.push({url: sprite});
                    return result;
                },
            []);
    }

    defineGeneration(id)
    {
        if (id <= 151)
            return {name: 'Generation I'};
        return {name: 'Generation II'};
    }

    defineGames(games)
    {
        return games.map(game => ({ name: game.version.name.capitalize()}));
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

    async createHandler()
    {
        const linkedTables =  await this.getLinkedTables();

        this.dataHandler = new PokemonTableDataHandle(linkedTables);
    }

    async getLinkedTables()
    {
        const ability = base.getTable('tblwx7HWRqtU57KQj');
        const queryResult = await ability.selectRecordsAsync({
            fields: ["Name"],
            sorts: [
                {field: "Name"},
            ]
        });

        const typeTable = base.getTable('tblJJmicJsbgIZhit');
        const queryResultTypes = await typeTable.selectRecordsAsync({
            fields: ["Name"],
            sorts: [
                {field: "Name"},
            ]
        });

        return [ queryResult.records, queryResultTypes.records];
    }

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
    }
    
    async fetchBatchPokemons(){
        this.fetchedPokemons = [];

        for (let x = 0; x < BatchSize; x++) {
            if(this.pokemonsUrl[x]) {
                const response = await remoteFetchAsync(this.pokemonsUrl[x].url);
                const payload = await response.json();
                if(payload) {
                    this.fetchedPokemons.push({ fields : await this.dataHandler.formatData(payload)});
                }
            }
        }
        this.pokemonsUrl = this.pokemonsUrl.slice(this.fetchedPokemons.length);
    }

    async createFetchedPokemons()
    {
        const initial = this.pokemonsUrl.length;
        output.markdown(`### \u{1F649} Created Pokemóns percentage: `);            
        output.markdown(`${Math.floor(((initial - this.pokemonsUrl.length) * 100)/initial)}%`)

        while(this.pokemonsUrl.length > 0)
        {
            await this.fetchBatchPokemons();
            await this.createPokemons();            
            output.markdown(`${Math.floor(((initial - this.pokemonsUrl.length) * 100)/initial)}%`)

        }
    }

    async process() {
        await this.createHandler();
        await this.deleteRecords();
        await this.fetchUrlPokemonsId();
        await this.createFetchedPokemons();
    }
}
        
const pokemon = new PokemonOrchestrator();
await pokemon.process();