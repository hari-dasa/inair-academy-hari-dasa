const PokeApi = "https://pokeapi.co/api/v2/";
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

            "fldGRP2zf5yCCbE35":    await this.getRecordsIdFromTable(types, 'Types', 'type'),
            "fldZdLOn3yJHggxDV":    await this.getRecordsIdFromTable(abilities, 'Abilities', 'ability'),

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
    constructor(record) {
        this.record     = record;
        this.dataHandler = new PokemonTableDataHandle();
    }

    async updatePokemon()
    {
        await table.createRecordAsync( await this.dataHandler.formatData(this.data));
    }
    
    async fetchdata(){
        let response = await remoteFetchAsync(`${PokeApi}pokemon/${this.record.name.toLowerCase()}`);
        this.data = await response.json();
        console.log(this.data);
    }

    async process() {
        if(this.record){
            await this.fetchdata();
            await this.updatePokemon();
        }

    }
}

const queryResult = await table.selectRecordsAsync({fields: [table.fields[0]]});
const record = await input.recordAsync("😺 Pick a Pokemón to get details: ", queryResult);
        
const pokemon = new PokemonOrchestrator(record);
await pokemon.process();

