import { api } from "./convex/_generated/api";
// 3. Helper to see structure at runtime
function logApiStructure() {
    console.log("=== CONVEX API STRUCTURE ===");
    // Get all available endpoints
    const endpoints = Object.keys(api).sort();
    console.log(`\nTotal endpoints: ${endpoints.length}\n`);
    // Group by module
    const modules = endpoints.reduce((acc, endpoint) => {
        const parts = endpoint.split("/");
        const module = parts[0];
        if (!acc[module])
            acc[module] = [];
        acc[module].push(endpoint);
        return acc;
    }, {});
    Object.entries(modules).forEach(([module, endpoints]) => {
        console.log(`\n📁 ${module}:`);
        endpoints.forEach((endpoint) => {
            const functions = Object.keys(api[endpoint] || {});
            console.log(`  📄 ${endpoint}: [${functions.join(", ")}]`);
        });
    });
    // Show how to access LMS functions specifically
    console.log("\n=== LMS ACCESS PATTERNS ===");
    console.log('Direct: api["lms/courses/queries"].searchCourses');
    console.log('Index:  api["lms/index"].courses.queries.searchCourses');
    return { endpoints, modules };
}
// 4. Type-safe way to get function signatures
function getFunctionType(module, func) {
    return api[module][func];
}
// Example usage:
// const searchCoursesType = getFunctionType("lms/courses/queries", "searchCourses");
export { logApiStructure, getFunctionType };
// Uncomment to run immediately:
// logApiStructure();
