import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Lock, FileText, RefreshCw, Download, Search, Filter, TrendingUp, Activity, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import MerkleBox from '../components/MerkleBox';
import AiExplainPanel from '../components/AiExplainPanel';
import jsPDF from 'jspdf';
import { API_URL } from '../config/api';

const Dashboard = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [merkleRoot, setMerkleRoot] = useState('');
    const [stats, setStats] = useState({ sqli: 0, xss: 0, benign: 0, total: 0 });
    const [threatLevel, setThreatLevel] = useState({ level: 'Low', color: 'green', attacks: 0 });
    const [timeSeries, setTimeSeries] = useState([]);
    const [topIPs, setTopIPs] = useState([]);
    const [strategyStats, setStrategyStats] = useState([]);
    const [confidenceStats, setConfidenceStats] = useState({ average: 0, min: 0, max: 0, total: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    const fetchLogs = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/logs`);
            setLogs(response.data.logs);
            setMerkleRoot(response.data.merkle_root);
            calculateStats(response.data.logs);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const [timeSeriesRes, topIPsRes, strategyRes, confidenceRes] = await Promise.all([
                axios.get(`${API_URL}/api/stats/time-series`),
                axios.get(`${API_URL}/api/stats/top-ips`),
                axios.get(`${API_URL}/api/stats/strategies`),
                axios.get(`${API_URL}/api/stats/confidence`)
            ]);
            setTimeSeries(timeSeriesRes.data);
            setTopIPs(topIPsRes.data);
            setStrategyStats(strategyRes.data);
            setConfidenceStats(confidenceRes.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const calculateStats = (data) => {
        let sqli = 0;
        let xss = 0;
        let benign = 0;
        data.forEach(log => {
            if (log.attack_type === 'SQLi') sqli++;
            else if (log.attack_type === 'XSS') xss++;
            else benign++;
        });
        const total = sqli + xss + benign;
        setStats({ sqli, xss, benign, total });

        // Calculate threat level based on recent attacks (last hour)
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentAttacks = data.filter(log => {
            try {
                const logTime = new Date(log.timestamp);
                return logTime > oneHourAgo && (log.attack_type === 'SQLi' || log.attack_type === 'XSS');
            } catch {
                return false;
            }
        }).length;

        let level = 'Low';
        let color = 'green';
        if (recentAttacks >= 20) {
            level = 'Critical';
            color = 'red';
        } else if (recentAttacks >= 10) {
            level = 'High';
            color = 'orange';
        } else if (recentAttacks >= 5) {
            level = 'Medium';
            color = 'yellow';
        }
        setThreatLevel({ level, color, attacks: recentAttacks });
    };

    useEffect(() => {
        fetchLogs();
        fetchStats();
        const interval = setInterval(() => {
            fetchLogs();
            fetchStats();
        }, 2000); // Live updates every 2 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Filter logs based on search and filter type
        let filtered = logs;
        
        if (filterType !== 'All') {
            filtered = filtered.filter(log => log.attack_type === filterType);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(log => 
                log.ip_address.toLowerCase().includes(query) ||
                log.input_payload.toLowerCase().includes(query) ||
                log.attack_type.toLowerCase().includes(query) ||
                log.deception_strategy.toLowerCase().includes(query)
            );
        }
        
        setFilteredLogs(filtered);
    }, [logs, searchQuery, filterType]);

    const downloadReport = (format = 'txt') => {
        const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;
        
        if (format === 'txt') {
            const reportContent = dataToExport.map(log =>
                `[${log.timestamp}] IP: ${log.ip_address} | Type: ${log.attack_type} | Payload: ${log.input_payload} | Strategy: ${log.deception_strategy} | Confidence: ${(log.confidence * 100).toFixed(1)}%`
        ).join('\n');

        const element = document.createElement("a");
        const file = new Blob([reportContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
            element.download = `forensic_report_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } else if (format === 'csv') {
            const headers = 'Timestamp,IP Address,Attack Type,Payload,Strategy,Confidence,Merkle Hash\n';
            const csvContent = headers + dataToExport.map(log =>
                `"${log.timestamp}","${log.ip_address}","${log.attack_type}","${log.input_payload.replace(/"/g, '""')}","${log.deception_strategy}","${log.confidence}","${log.merkle_hash || ''}"`
            ).join('\n');

            const element = document.createElement("a");
            const file = new Blob([csvContent], { type: 'text/csv' });
            element.href = URL.createObjectURL(file);
            element.download = `forensic_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } else if (format === 'json') {
            const jsonContent = JSON.stringify(dataToExport, null, 2);
            const element = document.createElement("a");
            const file = new Blob([jsonContent], { type: 'application/json' });
            element.href = URL.createObjectURL(file);
            element.download = `forensic_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(element);
        element.click();
            document.body.removeChild(element);
        }
    };

    const downloadPDFReport = () => {
        const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = margin;
        const lineHeight = 7;
        const maxWidth = pageWidth - (margin * 2);

        // Header
        doc.setFontSize(20);
        doc.setTextColor(16, 185, 129);
        doc.text('Secure Bank', margin, yPos);
        yPos += lineHeight * 1.5;
        
        doc.setFontSize(14);
        doc.setTextColor(156, 163, 175);
        doc.text('Forensic Dashboard Report', margin, yPos);
        yPos += lineHeight * 2;

        // Report metadata
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Total Logs: ${dataToExport.length}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Merkle Root: ${merkleRoot || 'N/A'}`, margin, yPos);
        yPos += lineHeight * 2;

        // Statistics
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Attack Statistics', margin, yPos);
        yPos += lineHeight * 1.5;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text(`SQL Injection Attacks: ${stats.sqli}`, margin, yPos);
        yPos += lineHeight;
        doc.setTextColor(245, 158, 11);
        doc.text(`XSS Attacks: ${stats.xss}`, margin, yPos);
        yPos += lineHeight;
        doc.setTextColor(16, 185, 129);
        doc.text(`Benign Traffic: ${stats.benign}`, margin, yPos);
        yPos += lineHeight * 2;

        // Attack Logs
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Attack Logs', margin, yPos);
        yPos += lineHeight * 1.5;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        dataToExport.forEach((log, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }

            const timestamp = new Date(log.timestamp).toLocaleString();
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`[${index + 1}] ${timestamp}`, margin, yPos);
            yPos += lineHeight;

            doc.setFont(undefined, 'bold');
            if (log.attack_type === 'SQLi') {
                doc.setTextColor(239, 68, 68);
            } else if (log.attack_type === 'XSS') {
                doc.setTextColor(245, 158, 11);
            } else {
                doc.setTextColor(16, 185, 129);
            }
            doc.text(`Type: ${log.attack_type}`, margin, yPos);
            yPos += lineHeight;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`IP: ${log.ip_address}`, margin, yPos);
            yPos += lineHeight;

            const payloadText = `Payload: ${log.input_payload}`;
            const payloadLines = doc.splitTextToSize(payloadText, maxWidth);
            doc.text(payloadLines, margin, yPos);
            yPos += lineHeight * payloadLines.length;

            doc.text(`Strategy: ${log.deception_strategy}`, margin, yPos);
            yPos += lineHeight;
            doc.text(`Confidence: ${(log.confidence * 100).toFixed(1)}%`, margin, yPos);
            yPos += lineHeight * 1.5;

            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += lineHeight;
        });

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Page ${i} of ${totalPages} | Secure Bank Forensic Dashboard`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        doc.save(`forensic_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const getThreatColor = (level) => {
        const colors = {
            'Low': 'bg-green-500',
            'Medium': 'bg-yellow-500',
            'High': 'bg-orange-500',
            'Critical': 'bg-red-500'
        };
        return colors[level] || 'bg-gray-500';
    };

    const getThreatTextColor = (level) => {
        const colors = {
            'Low': 'text-green-400',
            'Medium': 'text-yellow-400',
            'High': 'text-orange-400',
            'Critical': 'text-red-400'
        };
        return colors[level] || 'text-gray-400';
    };

    const pieData = [
        { name: 'SQLi', value: stats.sqli },
        { name: 'XSS', value: stats.xss },
        { name: 'Benign', value: stats.benign },
    ];

    const COLORS = ['#ef4444', '#f59e0b', '#10b981'];
    const total = stats.sqli + stats.xss + stats.benign;

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 text-gray-100 dark:text-gray-100 light:text-gray-900 p-4 sm:p-6 font-mono">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 border-b border-gray-700 dark:border-gray-700 light:border-gray-300 pb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-500 dark:text-green-500 light:text-green-600 flex items-center gap-2">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8" /> Secure Bank <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm">Forensic Dashboard</span>
                </h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="hidden sm:block text-left sm:text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">MERKLE ROOT (INTEGRITY CHECK)</p>
                        <p className="text-xs text-yellow-500 dark:text-yellow-500 light:text-yellow-600 font-mono bg-gray-800 dark:bg-gray-800 light:bg-gray-200 p-1 rounded break-all">{merkleRoot || "Calculating..."}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={toggleTheme}
                            className="bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 px-3 py-2 rounded flex items-center gap-2 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <div className="relative">
                            <select 
                                onChange={(e) => {
                                    if (e.target.value === 'pdf') {
                                        downloadPDFReport();
                                    } else {
                                        downloadReport(e.target.value);
                                    }
                                    e.target.value = '';
                                }}
                                className="bg-blue-600 dark:bg-blue-600 light:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-700 light:hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded flex items-center gap-2 appearance-none cursor-pointer pr-8 text-sm"
                            >
                                <option value="">Export...</option>
                                <option value="txt">TXT</option>
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                                <option value="pdf">PDF</option>
                            </select>
                            <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" />
                    </div>
                        <button onClick={() => navigate('/')} className="bg-red-600 dark:bg-red-600 light:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700 light:hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded flex items-center gap-2 text-sm">
                            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                    </button>
                    </div>
                </div>
            </header>

            {/* Merkle Box - Tamper Evidence */}
            <div className="mb-4 sm:mb-6">
                <MerkleBox />
            </div>

            {/* Threat Level Indicator */}
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-auto">
                        <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5" /> Real-Time Threat Level
                        </h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <span className={`text-2xl sm:text-3xl font-bold ${getThreatTextColor(threatLevel.level)}`}>
                                {threatLevel.level}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getThreatColor(threatLevel.level)} animate-pulse`}></div>
                                <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm">{threatLevel.attacks} active threats (last hour)</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm">Total Attacks</p>
                        <p className="text-xl sm:text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.total}</p>
                    </div>
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 shadow-lg">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 flex items-center gap-2 text-xs sm:text-sm"><AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-500" /> SQL Injection</h3>
                    <p className="text-3xl sm:text-4xl font-bold text-white dark:text-white light:text-gray-900">{stats.sqli}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">{total > 0 ? ((stats.sqli / total) * 100).toFixed(1) : 0}% of total</p>
                </div>
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 shadow-lg">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 flex items-center gap-2 text-xs sm:text-sm"><AlertTriangle size={14} className="sm:w-4 sm:h-4 text-yellow-500" /> XSS Attacks</h3>
                    <p className="text-3xl sm:text-4xl font-bold text-white dark:text-white light:text-gray-900">{stats.xss}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">{total > 0 ? ((stats.xss / total) * 100).toFixed(1) : 0}% of total</p>
                </div>
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 shadow-lg">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 flex items-center gap-2 text-xs sm:text-sm"><CheckCircle size={14} className="sm:w-4 sm:h-4 text-green-500" /> Benign Traffic</h3>
                    <p className="text-3xl sm:text-4xl font-bold text-white dark:text-white light:text-gray-900">{stats.benign}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">{total > 0 ? ((stats.benign / total) * 100).toFixed(1) : 0}% of total</p>
                </div>
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 shadow-lg">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 flex items-center gap-2 text-xs sm:text-sm"><TrendingUp size={14} className="sm:w-4 sm:h-4 text-blue-500" /> Total Events</h3>
                    <p className="text-3xl sm:text-4xl font-bold text-white dark:text-white light:text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">All time</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by IP, payload, attack type, or strategy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 dark:bg-gray-900 light:bg-gray-100 border border-gray-700 dark:border-gray-700 light:border-gray-300 rounded text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-green-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 border border-gray-700 dark:border-gray-700 light:border-gray-300 rounded px-3 sm:px-4 py-2 text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-green-500 text-sm"
                        >
                            <option value="All">All Types</option>
                            <option value="SQLi">SQLi</option>
                            <option value="XSS">XSS</option>
                            <option value="Benign">Benign</option>
                        </select>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 text-center sm:text-left">
                        Showing {filteredLogs.length} of {logs.length} logs
                    </div>
                </div>
                </div>

            {/* Time Series Chart */}
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 mb-4 sm:mb-6">
                <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Attack Trends (Last 24 Hours)</h3>
                <div className="h-48 sm:h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeries}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="hour" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="sqli" stroke="#ef4444" strokeWidth={2} name="SQLi" />
                            <Line type="monotone" dataKey="xss" stroke="#f59e0b" strokeWidth={2} name="XSS" />
                            <Line type="monotone" dataKey="benign" stroke="#10b981" strokeWidth={2} name="Benign" />
                            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Attack Distribution Pie Chart */}
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Attack Distribution</h3>
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Deception Strategy Effectiveness */}
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Deception Strategy Effectiveness</h3>
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={strategyStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="strategy" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                                <Bar dataKey="count" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Top Attacking IPs */}
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Top Attacking IPs</h3>
                    <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                        {topIPs.length > 0 ? topIPs.map((ipData, index) => (
                            <div key={index} className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 p-2 sm:p-3 rounded border border-gray-700 dark:border-gray-700 light:border-gray-300">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-white dark:text-white light:text-gray-900 font-mono text-xs sm:text-sm break-all pr-2">{ipData.ip}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs flex-shrink-0">#{index + 1}</span>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`${API_URL}/api/report/${ipData.ip}`);
                                                    if (response.ok) {
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `securebank-report-${ipData.ip.replace(/\./g, '-')}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                        document.body.removeChild(a);
                                                    } else {
                                                        const error = await response.json();
                                                        alert(`Failed to generate report: ${error.detail || 'Unknown error'}`);
                                                    }
                                                } catch (error) {
                                                    console.error('Error downloading report:', error);
                                                    alert('Error generating report. Please try again.');
                                                }
                                            }}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 light:bg-blue-500 light:hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                            title="Download Incident Report PDF"
                                        >
                                            <Download size={12} /> <span className="hidden sm:inline">Report</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 sm:gap-0 sm:justify-between text-xs mb-2">
                                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Total: {ipData.total}</span>
                                    <span className="text-red-400 dark:text-red-400 light:text-red-600">SQLi: {ipData.sqli}</span>
                                    <span className="text-yellow-400 dark:text-yellow-400 light:text-yellow-600">XSS: {ipData.xss}</span>
                                    <span className="text-green-400 dark:text-green-400 light:text-green-600">Benign: {ipData.benign}</span>
                                </div>
                                <div className="w-full bg-gray-700 dark:bg-gray-700 light:bg-gray-300 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full" 
                                        style={{ width: `${(ipData.total / (topIPs[0]?.total || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 text-center py-4 text-sm">No IP data available</p>
                        )}
                    </div>
                </div>

                {/* Confidence Score Statistics */}
                <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300">
                    <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Confidence Score Statistics</h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-2">
                                <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Average Confidence</span>
                                <span className="text-white dark:text-white light:text-gray-900 font-bold">{(confidenceStats.average * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 dark:bg-gray-700 light:bg-gray-300 rounded-full h-2 sm:h-3">
                                <div 
                                    className="bg-green-500 h-2 sm:h-3 rounded-full" 
                                    style={{ width: `${confidenceStats.average * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm mb-1">Minimum</p>
                                <p className="text-white dark:text-white light:text-gray-900 text-xl sm:text-2xl font-bold">{(confidenceStats.min * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm mb-1">Maximum</p>
                                <p className="text-white dark:text-white light:text-gray-900 text-xl sm:text-2xl font-bold">{(confidenceStats.max * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="pt-3 sm:pt-4 border-t border-gray-700 dark:border-gray-700 light:border-gray-300">
                            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs sm:text-sm">Total Attacks Analyzed</p>
                            <p className="text-white dark:text-white light:text-gray-900 text-2xl sm:text-3xl font-bold">{confidenceStats.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Live Attack Feed */}
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-white p-4 sm:p-6 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300">
                <h3 className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Live Attack Feed</h3>
                <div className="overflow-y-auto h-64 sm:h-80 md:h-96 space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                    {(filteredLogs.length > 0 ? filteredLogs : logs).map((log) => (
                        <div key={log.id} id={`log-${log.id}`} className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 p-2 sm:p-3 rounded border-l-4 border-gray-700 dark:border-gray-700 light:border-gray-300 hover:bg-gray-850 dark:hover:bg-gray-850 light:hover:bg-gray-200 transition-colors"
                                style={{ borderColor: log.attack_type === 'SQLi' ? '#ef4444' : log.attack_type === 'XSS' ? '#f59e0b' : '#10b981' }}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.attack_type === 'SQLi' ? 'bg-red-900 text-red-200' :
                                            log.attack_type === 'XSS' ? 'bg-yellow-900 text-yellow-200' :
                                                'bg-green-900 text-green-200'
                                        }`}>{log.attack_type}</span>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                                    <span className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Confidence: <span className="text-yellow-400 dark:text-yellow-400 light:text-yellow-600 font-bold">{((log.confidence || 0) * 100).toFixed(1)}%</span></span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm mt-1 text-gray-300 dark:text-gray-300 light:text-gray-700 break-all mb-2">{log.input_payload}</p>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs">
                                <span className="text-gray-500 dark:text-gray-500 light:text-gray-600">IP: {log.ip_address}</span>
                                <span className="text-indigo-400 dark:text-indigo-400 light:text-indigo-600">Strategy: {log.deception_strategy}</span>
                            </div>
                            {log.merkle_hash && (
                                <div className="mt-2 text-xs">
                                    <span className="text-gray-500 dark:text-gray-500 light:text-gray-600">Hash: </span>
                                    <span className="text-purple-400 dark:text-purple-400 light:text-purple-600 font-mono break-all">{log.merkle_hash.substring(0, 16)}...</span>
                                </div>
                            )}
                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={() => navigate(`/replay/${log.id}`)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 light:bg-blue-500 light:hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                                >
                                    View Replay
                                </button>
                                <button
                                    onClick={() => {
                                        // Show AI explanation in a modal or expand this log
                                        const logElement = document.getElementById(`log-${log.id}`);
                                        if (logElement) {
                                            // Toggle AI panel visibility
                                            const aiPanel = logElement.querySelector('.ai-panel');
                                            if (aiPanel) {
                                                aiPanel.classList.toggle('hidden');
                                            }
                                        }
                                    }}
                                    className="text-xs bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 light:bg-purple-500 light:hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors"
                                >
                                    AI Explain
                                </button>
                            </div>
                            {/* AI Panel (hidden by default, shown on click) */}
                            <div id={`ai-panel-${log.id}`} className="ai-panel hidden mt-3">
                                <AiExplainPanel eventId={log.id} eventData={log} />
                            </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
