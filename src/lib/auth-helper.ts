
import prisma from './prisma';

export async function getAuthenticatedUser(request: Request) {
    const { searchParams } = new URL(request.url);
    const addressFromQuery = searchParams.get('address');
    const addressFromHeader = request.headers.get('x-wallet-address');

    const address = addressFromHeader || addressFromQuery;

    if (!address) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress: address }
    });

    return user;
}
