// const BASE_URL = "https://cdn.jsdelivr.net/gh/JulianaAmoasei/3871-node-streams-front/backend/videos.json"
const BASE_URL = "http://localhost:3000/api/videos";

async function getResources() {
  try {
    const busca = await fetch(`${BASE_URL}`);
    console.log(busca.json());
    return busca.json();
  } catch(e) {
    console.error('erro', e);
  }
}

export default getResources;
