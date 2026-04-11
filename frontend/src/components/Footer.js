import React from "react";
import { NavLink } from "react-router-dom";

const FOOTER_LINKS = [
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "GitHub", href: "https://github.com", external: true },
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-white">Trend Anomaly Finder</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            AI-powered social media analytics platform that detects anomalies,
                            identifies trends, and delivers actionable insights in real-time.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            {FOOTER_LINKS.map(({ label, href, external }) => (
                                <li key={label}>
                                    {external ? (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-gray-400 hover:text-white transition-colors no-underline"
                                        >
                                            {label} ↗
                                        </a>
                                    ) : (
                                        <a
                                            href={href}
                                            className="text-sm text-gray-400 hover:text-white transition-colors no-underline"
                                        >
                                            {label}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Navigate */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                            Navigate
                        </h4>
                        <ul className="space-y-2">
                            {["Dashboard", "Alerts", "Insights", "Prediction"].map((page) => (
                                <li key={page}>
                                    <NavLink
                                        to={`/${page.toLowerCase()}`}
                                        className="text-sm text-gray-400 hover:text-white transition-colors no-underline"
                                    >
                                        {page}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Trend Anomaly Finder. Built for hackathon.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                            className="text-gray-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
