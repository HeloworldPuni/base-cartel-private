"use client";

import React from "react";

export default function CartelDashboard() {
    return (
        <div className="p-8 text-white">
            <h1 className="text-2xl font-bold mb-6">Dashboard Loaded</h1>

            <div className="grid grid-cols-1 gap-4">
                {/* Static Card 1 */}
                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                    <h2 className="text-gray-400 text-xs uppercase">Your Shares</h2>
                    <p className="text-2xl font-bold">0</p>
                </div>

                {/* Static Card 2 */}
                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                    <h2 className="text-gray-400 text-xs uppercase">Cartel Pot</h2>
                    <p className="text-2xl font-bold">$0</p>
                </div>

                {/* Static Card 3 */}
                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                    <h2 className="text-gray-400 text-xs uppercase">Cartel 24h Revenue</h2>
                    <p className="text-2xl font-bold">$0</p>
                </div>
            </div>
        </div>
    );
}
