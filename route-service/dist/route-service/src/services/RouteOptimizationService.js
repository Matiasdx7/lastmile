"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteOptimizationService = void 0;
const types_1 = require("../../../shared/types");
const uuid_1 = require("uuid");
class RouteOptimizationService {
    constructor(mapService) {
        this.mapService = mapService;
    }
    async optimizeRoutes(orders, vehicles, depotLocation) {
        const locations = [depotLocation, ...orders.map(order => order.deliveryAddress.coordinates)];
        const distanceMatrix = await this.mapService.calculateDistanceMatrix(locations);
        const vrpProblem = this.setupVRPProblem(orders, vehicles, distanceMatrix, depotLocation);
        const solution = this.solveVRP(vrpProblem);
        return this.convertSolutionToRoutes(solution, vrpProblem, orders, vehicles);
    }
    setupVRPProblem(orders, vehicles, distanceMatrix, depot) {
        const deliveryPoints = orders.map((order, index) => ({
            id: `point-${index + 1}`,
            orderId: order.id,
            demand: this.calculateTotalWeight(order.packageDetails),
            timeWindow: order.timeWindow,
            serviceTime: this.estimateServiceTime(order),
            location: order.deliveryAddress.coordinates
        }));
        const vehicleCapacities = vehicles.map((vehicle, index) => ({
            id: vehicle.id,
            capacity: vehicle.capacity.maxWeight,
            maxStops: vehicle.capacity.maxPackages,
            startLocation: 0,
            endLocation: 0
        }));
        return {
            deliveryPoints,
            vehicles: vehicleCapacities,
            distanceMatrix,
            depot
        };
    }
    solveVRP(problem) {
        return this.clarkeWrightSavings(problem);
    }
    clarkeWrightSavings(problem) {
        const { deliveryPoints, vehicles, distanceMatrix } = problem;
        const depot = 0;
        const savings = [];
        for (let i = 1; i <= deliveryPoints.length; i++) {
            for (let j = i + 1; j <= deliveryPoints.length; j++) {
                const saving = distanceMatrix[depot][i] + distanceMatrix[depot][j] - distanceMatrix[i][j];
                savings.push({ i, j, saving });
            }
        }
        savings.sort((a, b) => b.saving - a.saving);
        const routes = deliveryPoints.map((_, index) => [index + 1]);
        const routeMap = new Map();
        deliveryPoints.forEach((_, index) => {
            routeMap.set(index + 1, index);
        });
        const routeDemand = deliveryPoints.map(point => point.demand);
        const isStart = new Array(deliveryPoints.length + 1).fill(true);
        const isEnd = new Array(deliveryPoints.length + 1).fill(true);
        for (const { i, j, saving } of savings) {
            if (saving <= 0)
                continue;
            const routeWithI = routeMap.get(i);
            const routeWithJ = routeMap.get(j);
            if (routeWithI === routeWithJ)
                continue;
            const iAtStart = isStart[i];
            const iAtEnd = isEnd[i];
            const jAtStart = isStart[j];
            const jAtEnd = isEnd[j];
            if ((!iAtStart && !iAtEnd) || (!jAtStart && !jAtEnd))
                continue;
            const mergedDemand = routeDemand[routeWithI] + routeDemand[routeWithJ];
            if (mergedDemand > vehicles[0].capacity)
                continue;
            let newRoute = [];
            if (iAtEnd && jAtStart) {
                newRoute = [...routes[routeWithI], ...routes[routeWithJ]];
            }
            else if (iAtStart && jAtEnd) {
                newRoute = [...routes[routeWithJ], ...routes[routeWithI]];
            }
            else if (iAtStart && jAtStart) {
                newRoute = [...routes[routeWithI].reverse(), ...routes[routeWithJ]];
            }
            else if (iAtEnd && jAtEnd) {
                newRoute = [...routes[routeWithI], ...routes[routeWithJ].reverse()];
            }
            if (newRoute.length > 0) {
                routes[routeWithI] = newRoute;
                routeDemand[routeWithI] = mergedDemand;
                routes[routeWithJ] = [];
                routeDemand[routeWithJ] = 0;
                newRoute.forEach(point => {
                    routeMap.set(point, routeWithI);
                });
                isStart[newRoute[0]] = true;
                isEnd[newRoute[newRoute.length - 1]] = true;
                for (let k = 1; k < newRoute.length; k++) {
                    isStart[newRoute[k]] = false;
                }
                for (let k = 0; k < newRoute.length - 1; k++) {
                    isEnd[newRoute[k]] = false;
                }
            }
        }
        const finalRoutes = routes.filter(route => route.length > 0);
        const routesWithDepot = finalRoutes.map(route => [0, ...route, 0]);
        const assigned = new Set();
        routesWithDepot.forEach(route => {
            route.forEach(point => {
                if (point !== 0)
                    assigned.add(point);
            });
        });
        const unassigned = [];
        for (let i = 1; i <= deliveryPoints.length; i++) {
            if (!assigned.has(i))
                unassigned.push(i);
        }
        return {
            routes: routesWithDepot,
            unassigned
        };
    }
    convertSolutionToRoutes(solution, problem, orders, vehicles) {
        const { routes, unassigned } = solution;
        const { distanceMatrix, deliveryPoints } = problem;
        if (unassigned.length > 0) {
            console.warn(`${unassigned.length} delivery points could not be assigned to routes`);
        }
        return routes.map((route, routeIndex) => {
            const stops = route.slice(1, -1).map((pointIndex, sequenceIndex) => {
                const deliveryPoint = deliveryPoints[pointIndex - 1];
                const order = orders.find(o => o.id === deliveryPoint.orderId);
                return {
                    orderId: order.id,
                    address: order.deliveryAddress,
                    sequence: sequenceIndex,
                    estimatedArrival: new Date()
                };
            });
            const vehicleIndex = routeIndex % vehicles.length;
            const vehicle = vehicles[vehicleIndex];
            const totalDistance = this.calculateRouteDistance(route, distanceMatrix);
            const estimatedDuration = this.calculateRouteDuration(route, distanceMatrix);
            return {
                id: (0, uuid_1.v4)(),
                loadId: `load-${(0, uuid_1.v4)()}`,
                vehicleId: vehicle.id,
                stops,
                totalDistance,
                estimatedDuration,
                status: types_1.RouteStatus.PLANNED,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });
    }
    async validateRouteTimeWindows(route, orders) {
        const conflicts = [];
        const arrivalTimes = await this.calculateEstimatedArrivalTimes(route);
        for (let i = 0; i < route.stops.length; i++) {
            const stop = route.stops[i];
            const order = orders.find(o => o.id === stop.orderId);
            if (order && order.timeWindow) {
                const arrivalTime = arrivalTimes[i];
                const { startTime, endTime } = order.timeWindow;
                if (arrivalTime < startTime) {
                    conflicts.push(`Stop ${i + 1} (Order ${order.id}): Estimated arrival at ${arrivalTime.toLocaleTimeString()} is before the time window starts at ${startTime.toLocaleTimeString()}`);
                }
                else if (arrivalTime > endTime) {
                    conflicts.push(`Stop ${i + 1} (Order ${order.id}): Estimated arrival at ${arrivalTime.toLocaleTimeString()} is after the time window ends at ${endTime.toLocaleTimeString()}`);
                }
            }
        }
        return conflicts;
    }
    async calculateEstimatedArrivalTimes(route) {
        const arrivalTimes = [];
        let currentTime = new Date();
        for (const stop of route.stops) {
            currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
            arrivalTimes.push(new Date(currentTime));
            currentTime = new Date(currentTime.getTime() + 10 * 60 * 1000);
        }
        return arrivalTimes;
    }
    async generateTurnByTurnDirections(route) {
        const waypoints = route.stops.map(stop => stop.address.coordinates);
        const depotLocation = { latitude: 37.7749, longitude: -122.4194 };
        const allWaypoints = [depotLocation, ...waypoints, depotLocation];
        return this.mapService.getDirections(allWaypoints);
    }
    async suggestAlternativeRoutes(route, orders, vehicles) {
        const alternativeRoutes = [];
        const reversedStops = [...route.stops].reverse().map((stop, index) => ({
            ...stop,
            sequence: index
        }));
        const reversedRoute = {
            ...route,
            id: `${route.id}-alt1`,
            stops: reversedStops,
            updatedAt: new Date()
        };
        alternativeRoutes.push(reversedRoute);
        if (route.stops.length >= 4) {
            const swappedStops = [...route.stops];
            [swappedStops[0], swappedStops[swappedStops.length - 1]] =
                [swappedStops[swappedStops.length - 1], swappedStops[0]];
            swappedStops.forEach((stop, index) => {
                stop.sequence = index;
            });
            const swappedRoute = {
                ...route,
                id: `${route.id}-alt2`,
                stops: swappedStops,
                updatedAt: new Date()
            };
            alternativeRoutes.push(swappedRoute);
        }
        return alternativeRoutes;
    }
    calculateTotalWeight(packages) {
        return packages.reduce((sum, pkg) => sum + pkg.weight, 0);
    }
    estimateServiceTime(order) {
        return 5 + order.packageDetails.length * 2;
    }
    calculateRouteDistance(route, distanceMatrix) {
        let distance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            distance += distanceMatrix[route[i]][route[i + 1]];
        }
        return distance;
    }
    calculateRouteDuration(route, distanceMatrix) {
        const distance = this.calculateRouteDistance(route, distanceMatrix);
        return (distance / 30) * 60;
    }
}
exports.RouteOptimizationService = RouteOptimizationService;
//# sourceMappingURL=RouteOptimizationService.js.map