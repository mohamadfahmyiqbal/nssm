import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ScheduleBreak = sequelize.define('ScheduleBreak', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID'
    },
    technicianNik: {
        type: DataTypes.STRING(50), // 'ALL' untuk break global seluruh tim, atau NIK teknisi spesifik
        allowNull: false,
        defaultValue: 'ALL',
        field: 'TECHNICIAN_NIK'
    },
    technicianName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        defaultValue: 'Semua Teknisi',
        field: 'TECHNICIAN_NAME'
    },
    label: {
        type: DataTypes.STRING(100), // e.g. 'Istirahat Siang / Dzuhur', 'Coffee Break', 'Istirahat Ashar'
        allowNull: false,
        defaultValue: 'Istirahat',
        field: 'LABEL'
    },
    startTime: {
        type: DataTypes.STRING(10), // e.g. '12:00'
        allowNull: false,
        field: 'START_TIME'
    },
    endTime: {
        type: DataTypes.STRING(10), // e.g. '13:00'
        allowNull: false,
        field: 'END_TIME'
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 60,
        field: 'DURATION_MINUTES'
    },
    notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'NOTES'
    }
}, {
    tableName: 'ScheduleBreaks',
    timestamps: true
});

export default ScheduleBreak;
