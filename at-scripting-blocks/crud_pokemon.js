const PokeApi = "https://pokeapi.co/api/v2/";
const table = base.getTable("tblEWHy8pqeEgZKUp");

class PokemonTableDataHandle {
    constructor() {
        this.capitalize();
    }

    async formatData({id, name, height, weight, order, base_experience, stats, game_indices, sprites, types, abilities}){
        return {
            "Name":     name,//text or number
            "Height":      height,
            "Base Experience":      base_experience,
            "Weight":      weight,
            "HP":      stats[0].base_stat,
            "Attack":      stats[1].base_stat,
            "Defense":     stats[2].base_stat,
            "Order":      order,

            "Generation":   this.defineGeneration(id),//single

            "Games":     this.defineGames(game_indices),//multi

            "Types":          await this.getTypes(types),//linked
            "Abilities":     await this.getAbilities(abilities),

            "Sprites":        this.getAttachs(sprites),//attach
        };
    }

    async getTypes(types){
        const table = base.getTable("Types");
        let queryResult = await table.selectRecordsAsync({
            fields: ["Name"],
            sorts: [
                {field: "Name"},
            ]
        });

        const recordsIds = this.getTypesIdFromFilter( queryResult.records, types)
        return recordsIds;
    }

    getTypesIdFromFilter(records, types)
    {
        let recordsIds = [];
        for(var x = 0; x < types.length; x++) {
            let right  = records.length - 1;
            let left = 0;
            let middle = 0;

            while(left <= right){
                middle = Math.floor((left+right) / 2);

                if (records[middle].name.toLowerCase() == types[x].type.name){
                    recordsIds.push({ id: records[middle].id});//add the id to a array like choices
                    types.slice(x, 1)//
                    break;
                }else if(records[middle].name.toLowerCase()  < types[x].type.name){
                    left = middle + 1;//error, i cannot sum the value inside this loop
                } else {
                    right = middle - 1;
                }
            }
        
        }
        return recordsIds;
    }

    getAbilitiesIdFromFilter(records, abilities)
    {
        let recordsIds = [];
        for(var x = 0; x < abilities.length; x++) {
            let right  = records.length - 1;
            let left = 0;
            let middle = 0;

            while(left <= right){
                middle = Math.floor((left+right) / 2);

                if (records[middle].name.toLowerCase() == abilities[x].ability.name){
                    recordsIds.push({ id: records[middle].id});//add the id to a array like choices
                    abilities.slice(x, 1)//
                    break;
                }else if(records[middle].name.toLowerCase()  < abilities[x].ability.name){
                    left = middle + 1;//error, i cannot sum the value inside this loop
                } else {
                    right = middle - 1;
                }
            }
        
        }
        return recordsIds;
    }


    async getAbilities(abilities){
        const table = base.getTable("Abilities");
        let queryResult = await table.selectRecordsAsync({
            fields: ["Name"],
            sorts: [
                {field: "Name"},
            ]
        });

        const recordsIds = this.getAbilitiesIdFromFilter( queryResult.records, abilities)
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
        console.log(attachments)
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

