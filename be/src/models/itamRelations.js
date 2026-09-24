import MaintenanceSchedule from './MaintenanceSchedule.js';
import StandardMaintenance from './StandardMaintenance.js';
import MaintenanceActual from './MaintenanceActual.js';

// MaintenanceSchedule <-> StandardMaintenance
MaintenanceSchedule.belongsTo(StandardMaintenance, {
    foreignKey: 'standard_maintenance_id',
    as: 'standardMaintenance',
});

StandardMaintenance.hasMany(MaintenanceSchedule, {
    foreignKey: 'standard_maintenance_id',
    as: 'schedules',
});

// MaintenanceActual <-> MaintenanceSchedule
MaintenanceActual.belongsTo(MaintenanceSchedule, {
    foreignKey: 'schedule_id',
    as: 'schedule',
});

MaintenanceSchedule.hasMany(MaintenanceActual, {
    foreignKey: 'schedule_id',
    as: 'actuals',
});

export {
    MaintenanceSchedule,
    StandardMaintenance,
    MaintenanceActual,
};
