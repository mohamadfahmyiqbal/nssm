import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WorkOrder = sequelize.define('WorkOrder', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID'
    },
    woNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'WO_NUMBER'
    },
    woType: {
        type: DataTypes.STRING(30), // 'PREVENTIVE_MAINTENANCE' or 'INCIDENT_ANOMALY'
        allowNull: false,
        field: 'WO_TYPE'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'TITLE'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'DESCRIPTION'
    },
    priority: {
        type: DataTypes.STRING(20), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        allowNull: false,
        defaultValue: 'MEDIUM',
        field: 'PRIORITY'
    },
    status: {
        type: DataTypes.STRING(30), // 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'
        allowNull: false,
        defaultValue: 'OPEN',
        field: 'STATUS'
    },
    targetDate: {
        type: DataTypes.STRING(30), // YYYY-MM-DD
        allowNull: true,
        field: 'TARGET_DATE'
    },
    startTime: {
        type: DataTypes.STRING(10), // '08:00', '09:30', etc.
        allowNull: true,
        defaultValue: '08:00',
        field: 'START_TIME'
    },
    endTime: {
        type: DataTypes.STRING(10), // '10:00', '11:30', etc.
        allowNull: true,
        defaultValue: '10:00',
        field: 'END_TIME'
    },
    estimatedHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 1.0,
        field: 'ESTIMATED_HOURS'
    },
    targetDurationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'TARGET_DURATION_MINUTES'
    },
    actualHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'ACTUAL_HOURS'
    },
    actualStartTime: {
        type: DataTypes.STRING(10), // e.g., '08:15'
        allowNull: true,
        field: 'ACTUAL_START_TIME'
    },
    actualEndTime: {
        type: DataTypes.STRING(10), // e.g., '09:45'
        allowNull: true,
        field: 'ACTUAL_END_TIME'
    },
    actualDurationMinutes: {
        type: DataTypes.INTEGER, // e.g., 90
        allowNull: true,
        field: 'ACTUAL_DURATION_MINUTES'
    },
    // Manpower Allocation
    assignedTechnicianNik: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ASSIGNED_TECHNICIAN_NIK'
    },
    assignedTechnicianName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'ASSIGNED_TECHNICIAN_NAME'
    },
    teamMembersJson: {
        type: DataTypes.TEXT, // JSON array of [{ nik, name, role }]
        allowNull: true,
        field: 'TEAM_MEMBERS_JSON'
    },
    // Multi Devices Allocation
    devicesJson: {
        type: DataTypes.TEXT, // JSON array of device names / IPs / objects
        allowNull: true,
        field: 'DEVICES_JSON'
    },
    // Source Reference
    referenceId: {
        type: DataTypes.TEXT, // check_id for PM or IncidentReport ID (bisa menampung batch PM IDs)
        allowNull: true,
        field: 'REFERENCE_ID'
    },
    sourceMetadataJson: {
        type: DataTypes.TEXT, // detail check, device, subKategori, incident number, etc.
        allowNull: true,
        field: 'SOURCE_METADATA_JSON'
    },
    completionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'COMPLETION_NOTES'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'REMARKS'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'COMPLETED_AT'
    },
    createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'SYSTEM',
        field: 'CREATED_BY'
    }
}, {
    tableName: 'WorkOrders',
    timestamps: true
});

export default WorkOrder;
