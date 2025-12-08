                        </div >
    <Button
        variant="destructive"
        size="sm"
        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
        onClick={() => disconnect()}
    >
        Disconnect
    </Button>
                    </header >

    {/* Identity Card */ }
    < Card className = "card-glow border-zinc-700" >
        <CardContent className="p-4 flex items-center gap-4">
            <Identity
                address={address}
                className="bg-transparent border-none p-0 flex flex-row items-center gap-4"
            >
                <Avatar className="w-16 h-16 rounded-full border-2 border-[#4A87FF]" />
                <div className="flex flex-col">
                    {/* Manual Fallback for Name/Address since OnchainKit components are hidden */}
                    <div className="font-bold text-white text-lg heading-font">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown Member'}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                        {address}
                    </div>
                </div>
            </Identity>
        </CardContent>
                    </Card >

    {/* Referral Section */ }
    < Card className = "card-glow border-[#D4AF37]/30" >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white flex items-center gap-2">
                                🤝 Recruit Associates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Total Recruits</span>
                                <span className="text-white font-bold">{referralStats?.directInvitesUsed || 0}</span>
                            </div>

                            <Button
                                className="w-full bg-[#D4AF37] hover:bg-[#F4E5B8] text-black font-bold"
                                onClick={() => setIsReferralOpen(true)}
                            >
                                Get Referral Link
                            </Button>
                        </CardContent>
                    </Card >

    {/* Settings / Auto Agent */ }
    < div className = "space-y-3" >
                        <h2 className="text-lg font-bold heading-font text-zinc-200">Agent Configuration</h2>
                        <AutoAgentPanel />
                    </div >

    <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        address={address}
        referralCount={referralStats?.directInvitesUsed || 0}
    />
                </div >
            </AppLayout >
        </AuthenticatedRoute >
    );
}
