
import prisma from './prisma';

// Helper to sanitize slug
function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export class ClanService {

    /**
     * Create a new clan.
     * Transaction: Create Clan -> Create Owner Member -> Update User (implicit via relations logic)
     */
    static async createClan(userId: string, name: string, tag: string, description: string = '') {
        const slug = createSlug(name);

        // 1. Validation
        if (name.length < 3 || name.length > 30) throw new Error("Name must be between 3 and 30 characters");
        if (tag.length < 2 || tag.length > 5) throw new Error("Tag must be between 2 and 5 characters");

        // Check if user is already in a clan
        const existingMember = await prisma.clanMember.findUnique({
            where: { userId }
        });
        if (existingMember) throw new Error("User is already in a clan");

        // Check name uniqueness
        const existingClan = await prisma.clan.findUnique({ where: { slug } });
        if (existingClan) throw new Error("Clan name is taken");

        // 2. Transaction
        return await prisma.$transaction(async (tx) => {
            // Create Clan
            const clan = await tx.clan.create({
                data: {
                    name,
                    slug,
                    tag,
                    description,
                    ownerId: userId // Set owner relation
                }
            });

            // Create Member Record (Owner)
            await tx.clanMember.create({
                data: {
                    clanId: clan.id,
                    userId: userId,
                    role: 'OWNER'
                }
            });

            return clan;
        });
    }

    /**
     * Join an existing clan.
     */
    static async joinClan(userId: string, slug: string) {
        // 1. Validation
        const existingMember = await prisma.clanMember.findUnique({ where: { userId } });
        if (existingMember) throw new Error("User is already in a clan");

        const clan = await prisma.clan.findUnique({ where: { slug } });
        if (!clan) throw new Error("Clan not found");
        if (!clan.isActive) throw new Error("Clan is not active");

        // 2. Transaction (Future proofing for member limits etc)
        return await prisma.$transaction(async (tx) => {
            return await tx.clanMember.create({
                data: {
                    clanId: clan.id,
                    userId: userId,
                    role: 'MEMBER'
                },
                include: { clan: true }
            });
        });
    }

    /**
     * Leave current clan.
     * Owner cannot leave without transferring ownership (simplified: Owner cannot leave).
     */
    static async leaveClan(userId: string) {
        const member = await prisma.clanMember.findUnique({
            where: { userId },
            include: { clan: true }
        });

        if (!member) throw new Error("Not in a clan");

        if (member.role === 'OWNER') {
            throw new Error("Owner cannot leave the clan. Disband or transfer ownership first.");
        }

        return await prisma.clanMember.delete({
            where: { id: member.id }
        });
    }

    /**
     * Get clan details by slug.
     */
    static async getClanBySlug(slug: string) {
        const clan = await prisma.clan.findUnique({
            where: { slug },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                walletAddress: true,
                                farcasterHandle: true,
                                rep: true
                            }
                        }
                    },
                    orderBy: { role: 'asc' } // Owner first usually (Enum order: OWNER, OFFICER, MEMBER) is good? Enum is unordered in Prisma string, but alphabetic.
                    // Actually let's sort logically in UI or fetch owner separately.
                },
                owner: {
                    select: {
                        id: true,
                        walletAddress: true,
                        farcasterHandle: true
                    }
                }
            }
        });

        if (!clan) return null;
        return clan;
    }

    /**
     * Get my clan status.
     */
    static async getMyClan(userId: string) {
        return await prisma.clanMember.findUnique({
            where: { userId },
            include: {
                clan: true
            }
        });
    }
}
