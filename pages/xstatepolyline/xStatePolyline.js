import Konva from "konva";
import { setup, createActor } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction

const polylineMachine = setup({
    // Quelques actions et gardes que vous pouvez utiliser dans votre machine
    actions: {
        // Créer une nouvelle polyline
        createLine: () => {
            const pos = stage.getPointerPosition();
            polyline = new Konva.Line({
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: "red",
                strokeWidth: 2,
            });
            layer.add(polyline);
        },
        // Mettre à jour le dernier point (provisoire) de la polyline
        setLastPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;

            const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
            polyline.points(newPoints.concat([pos.x, pos.y]));
            layer.batchDraw();
        },
        // Enregistrer la polyline
        saveLine: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            // Le dernier point(provisoire) ne fait pas partie de la polyline
            const newPoints = currentPoints.slice(0, size - 2);
            polyline.points(newPoints);
            layer.batchDraw();
        },
        // Ajouter un point à la polyline
        addPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
            polyline.points(newPoints); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
        // Abandonner le tracé de la polyline
        abandon: () => {
            polyline.remove();
            polyline = undefined;
            layer.batchDraw();
        },
        // Supprimer le dernier point de la polyline
        removeLastPoint: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
            const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
            polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
    },
    guards: {
        // On peut encore ajouter un point
        pasPlein: () => {
            return polyline.points().length < MAX_POINTS * 2;
        },
        // On peut enlever un point
        plusDeDeuxPoints: () => {
            // Deux coordonnées pour chaque point, plus le point provisoire
            return polyline.points().length > 6;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMyKAnEQCMADgCsmvtsV9NAFgBMigOwWANCEyIAtHqJ8AbFb0W9fFZcUBff1s0LDxCIhpCAAVUAnFqemY2Tl5BWTQxSWlZBQQHCz4iFU0TdWLfQ20fW3sEU00LIldzRVNXY3VjNxVtY0DgjBwCYkiwGLiExiZaADUmfiEkEAyJKRkl3PNXDTLTI1azY0V1UxrEMu3jnW0T421XFQLtfuXBsJHo2Px4plgAYwAhsgwAt0qJVtkNo51IUeuoLDcdCpTMjdNozggEUVOu4+IoOiZjCoXiEhuEqAD8Jhxt9YJNmLN5mklissutQLlNOp1C4DOpWqYLCpjCL1BjzMYiNoLO1XM1TFUYQYSW9hkQKVSaeI6bQpsluKCWeC2TklJo1K1jnwynoFYpxa5CtpTDCVNzBa5jhYVaE1RrqV9tRQAEIAv4Aa1gyDDIOZIkya1NCB0LmMmlMac6fAKFg6GIcbSKcvuBlUMKOZh9ZOI-q1dNDEajMZ46kW8Yh7PkiAs5hchnTKmzjy5mnzWk0RBMii5+k6xnccqr73VlIDcTpTG+YAATob2yaoQgRdtHr4PK1NKpTnZEIKpdLTBmM1d588gq9feTV3WKL9AcC91eBNIQ5W8tCaOUjBUVx+W0FRoOMfMnyaeFs3xODlAKVxAnffBUAgOAwU-MAwWAztcgcbkJ2KUpymUfRqhvPJWjULxLFcEwXR6aVsPfUll1IchSI7JMhVTDiLl0KxoLFJiHGgogXT2R9px6ZQyiXP1v0DeAjTIpN7hPIVLDY+oryQicXVcaUbRle40008JRi1YSD1AhB4UUIge1LB54LlaDr1qGFqO5OULDCt0DE0HD-CAA */
    id: "polyLine",

    states: {
        idle: {
            on: {
                MOUSECLICK: {
                    target: "OnePoint",
                    actions: "createLine"
                }
            }
        },

        ManyPoints: {
            on: {
                MOUSEMOVE: {
                    target: "ManyPoints",
                    actions: "setLastPoint"
                },

                MOUSECLICK: {
                    target: "ManyPoints",
                    actions: "addPoint",
                    guard: "pasPlein"
                },

                Backspace: [{
                    target: "ManyPoints",
                    actions: "removeLastPoint",
                    guard: "plusDeDeuxPoints"
                }, {
                    target: "OnePoint",
                    actions: "removeLastPoint"
                }],

                Enter: {
                    target: "idle",
                    actions: "saveLine"
                },

                Escape: {
                    target: "idle",
                    actions: "abandon"
                }
            }
        },
        OnePoint: {
            on: {
                MOUSECLICK: {
                    target: "ManyPoints",
                    guard: "pasPlein",
                    actions: "addPoint"
                },

                MOUSEMOVE: {
                    target: "OnePoint",
                    actions: "setLastPoint"
                },

                Escape: {
                    target: "idle",
                    actions: "abandon"
                }
            }
        }
    },

    initial: "idle"
});

// On démarre la machine
const polylineActor = createActor(polylineMachine);
polylineActor.subscribe((snapshot) => {
    console.log("Current state:", snapshot.value);
});
polylineActor.start();

// On envoie les événements à la machine
stage.on("click", () => {
    polylineActor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
    polylineActor.send({ type: "MOUSEMOVE" });
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineActor.send({ type: event.key });
});
