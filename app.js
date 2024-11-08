class PokeAPI {
    constructor() {
        this.pokemonURL = "https://pokeapi.co/api/v2/pokemon/";
        this.pokemonTypeURL = "https://pokeapi.co/api/v2/type/";
    };

    async getPokemonData(idOrName) {
        const response = await fetch(`${this.pokemonURL}${idOrName}`);
        const { id, name, types, stats, weight, height, sprites } = await response.json();

        const type = this.getPokemonTypes(types);
        const base_stats = this.getPokemonBaseStats(stats);
        const img = this.getPokemonImages(sprites)

        return { id, name, type, base_stats, weight, height, img };
    };

    getPokemonTypes(types) {
        return types.map(obj => obj.type.name);
    };

    getPokemonBaseStats(stats) {
        const objectBaseStats = {};

        stats.forEach(obj => {
            objectBaseStats[obj.stat.name] = obj.base_stat;
        });

        return objectBaseStats;
    };

    getPokemonImages(sprites) {
        const {
            front_default: pixel,
            front_shiny: pixel_shiny,
            other: {
                home: {
                    front_default: hd,
                    front_shiny: hd_shiny
                }
            }
        } = sprites;

        return { pixel, pixel_shiny, hd, hd_shiny };
    };

    async getAllPokemonName() {
        let offset = 0;
        let limit = 675;
        const allPokemon = [];

        while (true) {
            const query = new URLSearchParams({
                offset: offset,
                limit: limit,
            });

            const response = await fetch(`${this.pokemonURL}?${query.toString()}`);
            const data = await response.json();
            const pokemonList = data.results;

            for (const data of pokemonList) {
                allPokemon.push(data.name);
            };

            offset += limit;

            if (!data.next) break;
        };

        return allPokemon;
    };
};

class PokemonCard extends PokeAPI {
    constructor() {
        super();
        this.elementColor = {
            psychic: "#f43f5e",
            fighting: "#dc2626",
            fire: "#f97316",
            ground: "#92400e",
            electric: "#facc15",
            bug: "#84cc16",
            grass: "#22c55e",
            flying: "#a5b4fc",
            ice: "#67e8f9",
            water: "#0ea5e9",
            dragon: "#1d4ed8",
            steel: "#155e75",
            ghost: "#312e81",
            poison: "#a21caf",
            fairy: "#f472b6",
            dark: "#0c0a09",
            rock: "#c7b78b",
            normal: "#6b7280",
        };
    };

    async generatePokemonCard(idOrName) {
        const pokemon = await super.getPokemonData(idOrName);

        const card = document.createElement("div");
        card.classList.add("card");

        const btnDetails = document.createElement("button");
        btnDetails.classList.add("btn-details");
        const btnIcon = document.createElement("img");
        btnIcon.classList.add("btn-icon");
        btnIcon.setAttribute("src", "src/icon/box-arrow-up-right.svg");
        btnDetails.append(btnIcon);
        btnDetails.onclick = () => this.seeDetails(pokemon);

        const cardImage = document.createElement("div");
        cardImage.classList.add("card-image")
        const pokemonImg = document.createElement("img");
        pokemonImg.setAttribute("src", `${pokemon.img.pixel}`);
        pokemonImg.setAttribute("alt", `${pokemon.name}`);
        cardImage.append(pokemonImg);

        const cardCaption = document.createElement("div");
        cardCaption.classList.add("card-caption");

        const pokemonName = document.createElement("h2");
        pokemonName.textContent = pokemon.name;
        const type = document.createElement("div");
        type.classList.add("type");
        type.innerHTML = this.generateSpanType(pokemon.type);
        cardCaption.append(pokemonName, type);

        card.append(btnDetails, cardImage, cardCaption);
        document.querySelector("#pokedex .container").append(card);
    };

    generateSpanType(arrType) {
        const spanType = arrType.map((type) => {
            const typeColor = this.getColorType(type);
            const spanTag = document.createElement("span");
            spanTag.textContent = type;
            spanTag.style.backgroundColor = typeColor;

            return spanTag.outerHTML;
        });

        return spanType.join('');
    };

    getColorType(type) {
        for (const key in this.elementColor) {
            if (key == type) {
                return this.elementColor[key];
            };
        };
    };

    async seeDetails(pokemon) {
        document.querySelector(".pokemon-image").innerHTML = /*html*/ `
            <img src="${pokemon.img.pixel}" alt="${pokemon.name}.png">
        `;

        document.querySelector(".pokemon-identity").innerHTML = /*html*/ `
            <h2>${pokemon.name}</h2>
            <div class="type">
                ${this.generateSpanType(pokemon.type)}
            </div>
        `;

        document.querySelector(".pokemon-physique").innerHTML = /*html*/ `
            <div class="pokemon-weight">
                <h3>${pokemon.weight} kg</h3>
                <small>Weight</small>
            </div>
            <div class="pokemon-height">
                <h3>${pokemon.height} cm</h3>
                <small>Height</small>
            </div>
        `;

        document.querySelectorAll(".range").forEach((element, index) => {
            element.setAttribute("value", Object.values(pokemon.base_stats)[index]);
        });

        document.querySelector(".container-details").classList.add("active");
    };
};

class Pokedex {
    constructor() {
        this.api = new PokeAPI();
        this.card = new PokemonCard();
        this.pokemon_list = [];
        this.lastCardIndex = 0;
    };

    async renderPokemonCard() {
        const btnLoadMore = document.getElementById("btnLoadMore");

        btnLoadMore.style.display = (this.lastCardIndex + 12 >= this.pokemon_list.length) ? "none" : "flex";
        btnLoadMore.disabled = true;
        btnLoadMore.textContent = "Loading...";
        btnLoadMore.style.cursor = "not-allowed";

        const cardsToRender = this.pokemon_list.slice(this.lastCardIndex, this.lastCardIndex + 12);

        for (const pokemon of cardsToRender) {
            await this.card.generatePokemonCard(pokemon);
        };

        btnLoadMore.disabled = false;
        btnLoadMore.textContent = "Load More Pokemons";
        btnLoadMore.style.cursor = "pointer";

        this.lastCardIndex += cardsToRender.length;
    };

    async searchPokemon(name) {
        const queryPokemon = name.toLowerCase();

        const searchResult = document.getElementById("searchResult");
        searchResult.style.display = "flex";
        searchResult.querySelector("strong").textContent = name;

        const allPokemon = await this.api.getAllPokemonName();
        const searchedPokemon = allPokemon.filter(pokemon => pokemon.includes(queryPokemon));

        const pokedexContainer = document.querySelector("#pokedex .container");
        pokedexContainer.innerHTML = (!searchedPokemon.length) ? "<h2>Pokemon Not Found!</h2>" : "";

        this.clearPokedex();
        this.pokemon_list = searchedPokemon;
        this.renderPokemonCard();
    }

    async sortPokemonByDex() {
        const allPokemon = await this.api.getAllPokemonName();

        this.clearPokedex();
        this.pokemon_list = allPokemon;
        this.renderPokemonCard();
    };

    clearPokedex() {
        document.querySelectorAll(".card").forEach(card => card.remove());
        this.lastCardIndex = 0;
    };
};

function main() {
    const pokedex = new Pokedex();

    pokedex.sortPokemonByDex();

    document.getElementById("closeButton").addEventListener("click", () => {
        document.querySelector(".container-details").classList.remove("active");
        document.querySelector(".pokemon-details").scrollTop = 0;
    });

    document.getElementById("btnLoadMore").addEventListener("click", () => {
        pokedex.renderPokemonCard();
    });

    document.querySelector(".navbar-logo").addEventListener("click", (e) => {
        e.preventDefault();
        location.reload();
    });

    document.getElementById("searchForm").addEventListener("submit", (e) => {
        e.preventDefault();
        pokedex.searchPokemon(document.getElementById("searchInput").value);
        e.target.reset();
    });

    document.getElementById("searchIcon").addEventListener("click", () => {
        document.querySelector("#searchForm .input-box").classList.add("active");
    });

    document.querySelector(".input-box .close-button").addEventListener("click", () => {
        document.querySelector("#searchForm .input-box").classList.remove("active");
    });

    window.addEventListener("resize", () => {
        document.querySelector("#searchForm .input-box").classList.remove("active");
    });
};

main();