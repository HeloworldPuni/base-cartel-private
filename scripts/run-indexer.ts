import { indexEvents } from '../src/lib/indexer-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function main() {
    console.log("--- MANUALLY RUNNING INDEXER ---");
    await indexEvents();
    console.log("--- DONE ---");
}

main().catch(console.error);
