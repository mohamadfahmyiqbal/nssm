// Helper fungsi rute ortogonal standar bawaan (default points)
export const getDefaultOrthogonalPoints = (sourceX, sourceY, targetX, targetY, sourcePosition = 'bottom', targetPosition = 'top') => {
    if (sourceX === undefined || sourceY === undefined || targetX === undefined || targetY === undefined) return [];

    const isSourceVert = sourcePosition === 'top' || sourcePosition === 'bottom';
    const isTargetVert = targetPosition === 'top' || targetPosition === 'bottom';

    if (isSourceVert && isTargetVert) {
        if (sourcePosition === 'bottom' && targetPosition === 'top' && targetY > sourceY + 20) {
            const midY = (sourceY + targetY) / 2;
            return [
                { x: sourceX, y: sourceY },
                { x: sourceX, y: midY },
                { x: targetX, y: midY },
                { x: targetX, y: targetY }
            ];
        }
        if (sourcePosition === 'top' && targetPosition === 'bottom' && sourceY > targetY + 20) {
            const midY = (sourceY + targetY) / 2;
            return [
                { x: sourceX, y: sourceY },
                { x: sourceX, y: midY },
                { x: targetX, y: midY },
                { x: targetX, y: targetY }
            ];
        }
        const stubOffset = 25;
        const sOutY = sourcePosition === 'bottom' ? sourceY + stubOffset : sourceY - stubOffset;
        const tInY = targetPosition === 'top' ? targetY - stubOffset : targetY + stubOffset;
        const midX = (sourceX + targetX) / 2;
        return [
            { x: sourceX, y: sourceY },
            { x: sourceX, y: sOutY },
            { x: midX, y: sOutY },
            { x: midX, y: tInY },
            { x: targetX, y: tInY },
            { x: targetX, y: targetY }
        ];
    }

    if (!isSourceVert && !isTargetVert) {
        if (sourcePosition === 'right' && targetPosition === 'left' && targetX > sourceX + 20) {
            const midX = (sourceX + targetX) / 2;
            return [
                { x: sourceX, y: sourceY },
                { x: midX, y: sourceY },
                { x: midX, y: targetY },
                { x: targetX, y: targetY }
            ];
        }
        const stubOffset = 25;
        const sOutX = sourcePosition === 'right' ? sourceX + stubOffset : sourceX - stubOffset;
        const tInX = targetPosition === 'left' ? targetX - stubOffset : targetX + stubOffset;
        const midY = (sourceY + targetY) / 2;
        return [
            { x: sourceX, y: sourceY },
            { x: sOutX, y: sourceY },
            { x: sOutX, y: midY },
            { x: tInX, y: midY },
            { x: tInX, y: targetY },
            { x: targetX, y: targetY }
        ];
    }

    if (isSourceVert && !isTargetVert) {
        return [
            { x: sourceX, y: sourceY },
            { x: sourceX, y: targetY },
            { x: targetX, y: targetY }
        ];
    }

    return [
        { x: sourceX, y: sourceY },
        { x: targetX, y: sourceY },
        { x: targetX, y: targetY }
    ];
};

// Helper untuk mengadaptasi titik kontrol kustom saat node source atau target dipindahkan
export const adaptControlPoints = (controlPoints, sourceX, sourceY, targetX, targetY, sourceAnchor, targetAnchor) => {
    if (!controlPoints || controlPoints.length === 0) return [];
    if (!sourceAnchor || !targetAnchor) return controlPoints;

    const deltaSX = sourceX - sourceAnchor.x;
    const deltaSY = sourceY - sourceAnchor.y;
    const deltaTX = targetX - targetAnchor.x;
    const deltaTY = targetY - targetAnchor.y;

    if (Math.abs(deltaSX) < 0.1 && Math.abs(deltaSY) < 0.1 && Math.abs(deltaTX) < 0.1 && Math.abs(deltaTY) < 0.1) {
        return controlPoints;
    }

    const baseDist = Math.hypot(targetAnchor.x - sourceAnchor.x, targetAnchor.y - sourceAnchor.y) || 1;

    return controlPoints.map((cp, idx) => {
        const indexT = (idx + 1) / (controlPoints.length + 1);
        const distFromSource = Math.hypot(cp.x - sourceAnchor.x, cp.y - sourceAnchor.y);
        const distFromTarget = Math.hypot(cp.x - targetAnchor.x, cp.y - targetAnchor.y);
        const totalDist = distFromSource + distFromTarget;
        const distT = totalDist > 0 ? (distFromSource / totalDist) : indexT;

        const t = Math.max(0, Math.min(1, (indexT + distT) / 2));

        const shiftX = (1 - t) * deltaSX + t * deltaTX;
        const shiftY = (1 - t) * deltaSY + t * deltaTY;

        return {
            x: cp.x + shiftX,
            y: cp.y + shiftY
        };
    });
};

// Helper untuk menghasilkan rute ortogonal lengkap yang adaptif
export const getFullOrthogonalRoute = (sourceX, sourceY, targetX, targetY, controlPoints = [], sourcePosition = 'bottom', targetPosition = 'top') => {
    if (sourceX === undefined || sourceY === undefined || targetX === undefined || targetY === undefined) return [];

    if (!controlPoints || controlPoints.length === 0) {
        return getDefaultOrthogonalPoints(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
    }

    const isSourceVert = sourcePosition === 'top' || sourcePosition === 'bottom';
    const isTargetVert = targetPosition === 'top' || targetPosition === 'bottom';

    const rawKeyPoints = [{ x: sourceX, y: sourceY }, ...controlPoints, { x: targetX, y: targetY }];
    const route = [rawKeyPoints[0]];

    for (let i = 0; i < rawKeyPoints.length - 1; i++) {
        const from = rawKeyPoints[i];
        const to = rawKeyPoints[i + 1];

        const isCurrentHoriz = Math.abs(from.y - to.y) < 1.5;
        const isCurrentVert = Math.abs(from.x - to.x) < 1.5;

        if (isCurrentHoriz || isCurrentVert) {
            route.push(to);
        } else {
            if (i === 0) {
                if (isSourceVert) {
                    route.push({ x: from.x, y: to.y });
                } else {
                    route.push({ x: to.x, y: from.y });
                }
            } else if (i === rawKeyPoints.length - 2) {
                if (isTargetVert) {
                    route.push({ x: to.x, y: from.y });
                } else {
                    route.push({ x: from.x, y: to.y });
                }
            } else {
                route.push({ x: to.x, y: from.y });
            }
            route.push(to);
        }
    }

    const cleaned = [];
    for (let i = 0; i < route.length; i++) {
        if (cleaned.length === 0) {
            cleaned.push(route[i]);
        } else {
            const prev = cleaned[cleaned.length - 1];
            const dist = Math.hypot(route[i].x - prev.x, route[i].y - prev.y);
            if (dist > 1.5) {
                cleaned.push(route[i]);
            }
        }
    }

    return cleaned;
};

// Global registry untuk menyimpan rute koordinat visual nyata dari setiap edge yang sedang aktif di-render
export const registeredEdgeRoutes = new Map();

export const registerEdgeRoute = (edgeId, points) => {
    if (edgeId && Array.isArray(points) && points.length >= 2) {
        registeredEdgeRoutes.set(edgeId, points);
    }
};

export const unregisterEdgeRoute = (edgeId) => {
    if (edgeId) {
        registeredEdgeRoutes.delete(edgeId);
    }
};

// Helper untuk mengambil seluruh titik segmen suatu edge
export const getEdgeSegments = (edge, allNodes = []) => {
    if (!edge) return [];

    // Jika edge telah di-render dan mendaftarkan rute aktualnya, gunakan data presisi tersebut
    if (registeredEdgeRoutes.has(edge.id)) {
        return registeredEdgeRoutes.get(edge.id);
    }

    let sX = edge.sourceX;
    let sY = edge.sourceY;
    let tX = edge.targetX;
    let tY = edge.targetY;
    let sPos = edge.sourcePosition || 'bottom';
    let tPos = edge.targetPosition || 'top';

    if ((sX === undefined || tX === undefined) && Array.isArray(allNodes) && allNodes.length > 0) {
        const sNode = allNodes.find(n => n.id === edge.source);
        const tNode = allNodes.find(n => n.id === edge.target);
        if (sNode && tNode) {
            const sHandle = sNode[Symbol.for('internals')]?.handleBounds?.source?.find(h => h.id === edge.sourceHandle)
                || sNode.handleBounds?.source?.find(h => h.id === edge.sourceHandle);
            const tHandle = tNode[Symbol.for('internals')]?.handleBounds?.target?.find(h => h.id === edge.targetHandle)
                || tNode.handleBounds?.target?.find(h => h.id === edge.targetHandle);

            const sPosData = sNode.positionAbsolute || sNode.position || { x: 0, y: 0 };
            const tPosData = tNode.positionAbsolute || tNode.position || { x: 0, y: 0 };

            if (sHandle) {
                sX = sPosData.x + sHandle.x + sHandle.width / 2;
                sY = sPosData.y + sHandle.y + sHandle.height / 2;
                sPos = sHandle.position || sPos;
            } else {
                sX = sPosData.x + (sNode.width || 280) / 2;
                sY = sPosData.y + (sNode.height || 140);
            }

            if (tHandle) {
                tX = tPosData.x + tHandle.x + tHandle.width / 2;
                tY = tPosData.y + tHandle.y + tHandle.height / 2;
                tPos = tHandle.position || tPos;
            } else {
                tX = tPosData.x + (tNode.width || 280) / 2;
                tY = tPosData.y;
            }
        }
    }

    if (sX === undefined || tX === undefined) return [];

    const cps = edge.data?.controlPoints || (edge.data?.controlPoint ? [edge.data.controlPoint] : []);
    const sourceAnchor = edge.data?.sourceAnchor;
    const targetAnchor = edge.data?.targetAnchor;
    const adaptedCps = adaptControlPoints(cps, sX, sY, tX, tY, sourceAnchor, targetAnchor);

    return getFullOrthogonalRoute(
        sX,
        sY,
        tX,
        tY,
        adaptedCps,
        sPos,
        tPos
    );
};

// Algoritma pembentuk SVG Path dengan Corner Radius Halus & Jembatan Lengkung (Arc Bridge / Hop Over)
export const buildPathWithBridgesAndCorners = (currentEdgeId, currentPoints, allEdges, allNodes = [], cornerRadius = 6, bridgeRadius = 7) => {
    if (!currentPoints || currentPoints.length < 2) return '';

    const otherSegments = [];
    if (Array.isArray(allEdges) && allEdges.length > 1) {
        allEdges.forEach(otherEdge => {
            if (otherEdge.id === currentEdgeId) return;
            const otherPts = getEdgeSegments(otherEdge, allNodes);
            if (!otherPts || otherPts.length < 2) return;
            for (let j = 0; j < otherPts.length - 1; j++) {
                const op1 = otherPts[j];
                const op2 = otherPts[j + 1];
                const odx = op2.x - op1.x;
                const ody = op2.y - op1.y;
                if (Math.hypot(odx, ody) < 1) continue;
                otherSegments.push({
                    p1: op1,
                    p2: op2,
                    edgeId: otherEdge.id,
                    isHorizontal: Math.abs(ody) < 2,
                    isVertical: Math.abs(odx) < 2
                });
            }
        });
    }

    let path = `M ${currentPoints[0].x.toFixed(1)},${currentPoints[0].y.toFixed(1)}`;

    for (let i = 0; i < currentPoints.length - 1; i++) {
        const p1 = currentPoints[i];
        const p2 = currentPoints[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segLen = Math.hypot(dx, dy);

        if (segLen < 1) continue;

        const isCurrentHoriz = Math.abs(dy) < 2;
        const isCurrentVert = Math.abs(dx) < 2;

        const intersections = [];

        if (otherSegments.length > 0) {
            otherSegments.forEach(otherSeg => {
                let currentHasPriority = false;
                if (isCurrentHoriz && otherSeg.isVertical) {
                    currentHasPriority = true;
                } else if (isCurrentVert && otherSeg.isHorizontal) {
                    currentHasPriority = false;
                } else {
                    currentHasPriority = String(currentEdgeId) > String(otherSeg.edgeId);
                }

                if (!currentHasPriority) return;

                const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
                const x3 = otherSeg.p1.x, y3 = otherSeg.p1.y, x4 = otherSeg.p2.x, y4 = otherSeg.p2.y;

                if (isCurrentHoriz && otherSeg.isVertical) {
                    const minX = Math.min(x1, x2);
                    const maxX = Math.max(x1, x2);
                    const minY = Math.min(y3, y4);
                    const maxY = Math.max(y3, y4);
                    const crossX = (x3 + x4) / 2;
                    const crossY = (y1 + y2) / 2;

                    // Periksa apakah garis vertikal lawan memang memotong rentang horizontal segmen ini
                    if (crossX > minX + bridgeRadius + 1 && crossX < maxX - bridgeRadius - 1 &&
                        crossY > minY + 2 && crossY < maxY - 2) {
                        const distFromStart = Math.hypot(crossX - x1, crossY - y1);
                        intersections.push({
                            dist: distFromStart,
                            x: crossX,
                            y: crossY
                        });
                    }
                    return;
                }

                if (isCurrentVert && otherSeg.isHorizontal) {
                    const minY = Math.min(y1, y2);
                    const maxY = Math.max(y1, y2);
                    const minX = Math.min(x3, x4);
                    const maxX = Math.max(x3, x4);
                    const crossX = (x1 + x2) / 2;
                    const crossY = (y3 + y4) / 2;

                    // Periksa apakah garis horizontal lawan memang memotong rentang vertikal segmen ini
                    if (crossY > minY + bridgeRadius + 1 && crossY < maxY - bridgeRadius - 1 &&
                        crossX > minX + 2 && crossX < maxX - 2) {
                        const distFromStart = Math.hypot(crossX - x1, crossY - y1);
                        intersections.push({
                            dist: distFromStart,
                            x: crossX,
                            y: crossY
                        });
                    }
                    return;
                }

                // Untuk segmen diagonal / non-ortogonal
                const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                if (Math.abs(denom) < 1e-4) return;

                const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
                const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

                if (t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99) {
                    const crossX = x1 + t * dx;
                    const crossY = y1 + t * dy;
                    const distFromStart = t * segLen;
                    if (distFromStart > bridgeRadius + 2 && distFromStart < segLen - bridgeRadius - 2) {
                        intersections.push({
                            dist: distFromStart,
                            x: crossX,
                            y: crossY
                        });
                    }
                }
            });
        }

        intersections.sort((a, b) => a.dist - b.dist);

        const validIntersections = [];
        intersections.forEach(inter => {
            if (validIntersections.length === 0 || (inter.dist - validIntersections[validIntersections.length - 1].dist) > bridgeRadius * 2 + 4) {
                validIntersections.push(inter);
            }
        });

        const ux = dx / segLen;
        const uy = dy / segLen;

        validIntersections.forEach(inter => {
            const startBridgeX = inter.x - bridgeRadius * ux;
            const startBridgeY = inter.y - bridgeRadius * uy;
            const endBridgeX = inter.x + bridgeRadius * ux;
            const endBridgeY = inter.y + bridgeRadius * uy;

            // Orientasi sweep-flag:
            // Jika horizontal ke kanan (ux > 0): sweep = 0 membuat busur melengkung ke atas (y negatif).
            // Jika horizontal ke kiri (ux < 0): sweep = 1 membuat busur melengkung ke atas (y negatif).
            // Jika vertikal ke bawah (uy > 0): sweep = 1 membuat busur melengkung ke kanan/luar.
            // Jika vertikal ke atas (uy < 0): sweep = 0 membuat busur melengkung ke kanan/luar.
            const sweepFlag = (ux < 0 || uy > 0) ? 1 : 0;

            path += ` L ${startBridgeX.toFixed(1)},${startBridgeY.toFixed(1)}`;
            path += ` A ${bridgeRadius} ${bridgeRadius} 0 0 ${sweepFlag} ${endBridgeX.toFixed(1)},${endBridgeY.toFixed(1)}`;
        });

        const nextPoint = currentPoints[i + 2];
        if (nextPoint && cornerRadius > 0) {
            const nextDx = nextPoint.x - p2.x;
            const nextDy = nextPoint.y - p2.y;
            const nextSegLen = Math.hypot(nextDx, nextDy);
            const effRadius = Math.min(cornerRadius, segLen / 2, nextSegLen / 2);

            if (effRadius > 1.5) {
                const cornerStartX = p2.x - effRadius * ux;
                const cornerStartY = p2.y - effRadius * uy;
                const nextUx = nextDx / nextSegLen;
                const nextUy = nextDy / nextSegLen;
                const cornerEndX = p2.x + effRadius * nextUx;
                const cornerEndY = p2.y + effRadius * nextUy;

                path += ` L ${cornerStartX.toFixed(1)},${cornerStartY.toFixed(1)}`;
                path += ` Q ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${cornerEndX.toFixed(1)},${cornerEndY.toFixed(1)}`;
                continue;
            }
        }

        path += ` L ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    return path;
};
