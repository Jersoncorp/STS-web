// Import Firebase Firestore and storage references
import { firestore } from '../../../resources/script/config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// Function to fetch apprehension data (daily, monthly, yearly, location-based, and violation frequency)
async function fetchApprehensionData() {
    const dailyData = {};
    const monthlyData = {};
    const yearlyData = {};
    const locationData = {};
    const violationCounts = {}; // Object to count occurrences of each violation

    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp; // Assuming 'timestamp' is the field name in epoch format
            const address = data.address; // Assuming 'address' is the field name
            const selectedViolations = data.selectedViolations || []; // Assuming 'selectedViolations' is an array of objects with a `name` property

            // Convert epoch timestamp to date
            const date = new Date(timestamp * 1000);
            const day = date.toLocaleDateString(); // Get full date (day)
            const monthIndex = date.getMonth(); // Get zero-based month index (0 for Jan, 11 for Dec)

            // Map index to month abbreviation
            const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];

            // Count apprehensions per day
            dailyData[day] = (dailyData[day] || 0) + 1;

            // Count apprehensions per month
            monthlyData[monthAbbr] = (monthlyData[monthAbbr] || 0) + 1;

            // Count apprehensions per year
            const year = date.getFullYear();
            yearlyData[year] = (yearlyData[year] || 0) + 1;

            // Count apprehensions per location
            locationData[address] = (locationData[address] || 0) + 1;

            // Count violations
            selectedViolations.forEach((violation) => {
                const violationName = violation.name; // Extract the `name` property
                if (violationName) {
                    violationCounts[violationName] = (violationCounts[violationName] || 0) + 1;
                }
            });
        });
    } catch (error) {
        console.error("Error fetching apprehension data:", error);
    }

    return { dailyData, monthlyData, yearlyData, locationData, violationCounts };
}

// Function to generate recommendations based on data
function generateRecommendations({ dailyData, monthlyData, yearlyData, locationData, violationCounts }) {
    let recommendation = "No significant issues detected.";

    // Analyze data for recommendations
    const maxDaily = Math.max(...Object.values(dailyData), 0);
    const maxMonthly = Math.max(...Object.values(monthlyData), 0);
    const maxYearly = Math.max(...Object.values(yearlyData), 0);
    const maxLocation = Math.max(...Object.values(locationData), 0);

    const criticalData = { daily: maxDaily, monthly: maxMonthly, yearly: maxYearly, location: maxLocation };
    const highestCategory = Object.keys(criticalData).reduce((a, b) =>
        criticalData[a] > criticalData[b] ? a : b
    );

    // Generate specific recommendation
    switch (highestCategory) {
        case 'daily':
            recommendation = `Daily apprehensions are unusually high (${maxDaily}). Increase monitoring efforts today.`;
            break;
        case 'monthly':
            recommendation = `This month has a significant number of cases (${maxMonthly}). Consider reviewing policies and resource allocation.`;
            break;
        case 'yearly':
            recommendation = `Yearly apprehensions are peaking at ${maxYearly}. A long-term strategic plan is recommended.`;
            break;
        case 'location':
            const maxLocationName = Object.keys(locationData).find(key => locationData[key] === maxLocation);
            recommendation = `The location with the highest apprehensions (${maxLocation}) is ${maxLocationName}. Deploy additional resources here.`;
            break;
        default:
            recommendation = "No significant issues detected.";
    }

    // Display the recommendation
    document.getElementById("recommendationText").textContent = recommendation;
}

// Function to prepare and render charts
async function renderCharts() {
    const apprehensionData = await fetchApprehensionData();

    // Prepare daily data for the chart
    const dailyLabels = Object.keys(apprehensionData.dailyData);
    const dailyCounts = Object.values(apprehensionData.dailyData);

    const dailyChartData = {
        labels: dailyLabels,
        datasets: [{
            label: 'Individuals Apprehended (Daily)',
            data: dailyCounts,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    // Prepare monthly data for the chart
    const monthlyLabels = Object.keys(apprehensionData.monthlyData);
    const monthlyCounts = Object.values(apprehensionData.monthlyData);

    const monthlyChartData = {
        labels: monthlyLabels,
        datasets: [{
            label: 'Individuals Apprehended (Monthly)',
            data: monthlyCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    // Prepare yearly data for the chart
    const yearlyLabels = Object.keys(apprehensionData.yearlyData);
    const yearlyCounts = Object.values(apprehensionData.yearlyData);

    const yearlyChartData = {
        labels: yearlyLabels,
        datasets: [{
            label: 'Individuals Apprehended (Yearly)',
            data: yearlyCounts,
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
        }]
    };

    // Prepare location data for the chart
    const locationLabels = Object.keys(apprehensionData.locationData);
    const locationCounts = Object.values(apprehensionData.locationData);

    const locationChartData = {
        labels: locationLabels,
        datasets: [{
            label: 'Apprehensions by Location',
            data: locationCounts,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };

    // Prepare most frequent violations data for the chart
    const sortedViolations = Object.entries(apprehensionData.violationCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
        .slice(0, 10); // Limit to top 10 violations

    const violationLabels = sortedViolations.map(([violation]) => violation);
    const violationCountsData = sortedViolations.map(([_, count]) => count);

    const violationsChartData = {
        labels: violationLabels,
        datasets: [{
            label: 'Violation Frequency',
            data: violationCountsData,
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    // Chart Configurations
    new Chart(document.getElementById('dailyChart'), {
        type: 'line',
        data: dailyChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(document.getElementById('monthlyChart'), {
        type: 'bar',
        data: monthlyChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(document.getElementById('yearlyChart'), {
        type: 'bar',
        data: yearlyChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(document.getElementById('locationChart'), {
        type: 'bar',
        data: locationChartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(document.getElementById('violationsChart'), {
        type: 'bar',
        data: violationsChartData,
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });

    // Generate and display recommendations
    generateRecommendations(apprehensionData);
}

// Call the renderCharts function to execute
renderCharts();
