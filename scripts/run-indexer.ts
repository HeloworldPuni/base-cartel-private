import { indexEvents } from '../src/lib/indexer-service';

async function main() {
    console.log("--- MANUALLY RUNNING INDEXER ---");
    await indexEvents();
    console.log("--- DONE ---");
}

main().catch(console.error);
