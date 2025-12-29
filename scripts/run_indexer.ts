
import { indexEvents } from '../src/lib/indexer-service';
import * as dotenv from 'dotenv';
import prisma from '../src/lib/prisma';

dotenv.config();

async function main() {
    console.log("--- MANUALLY TRIGGERING INDEXER ---");
    try {
        await indexEvents();
        console.log("--- INDEXING COMPLETE ---");
    } catch (e) {
        console.error("Indexing failed:", e);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
