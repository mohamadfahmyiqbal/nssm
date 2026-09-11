import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Floorplan = sequelize.define('Floorplan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING, // Diubah ke STRING untuk mencegah error syntax pada MSSQL
        defaultValue: 'DETAIL',
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Penggunaan TEXT dengan getter/setter JSON parsing agar kompatibel penuh dengan MSSQL & MySQL
    lines: {
        type: DataTypes.TEXT,
        get() {
            const val = this.getDataValue('lines');
            return val ? (typeof val === 'string' ? JSON.parse(val) : val) : [];
        },
        set(val) {
            this.setDataValue('lines', typeof val === 'string' ? val : JSON.stringify(val));
        }
    },
    rooms: {
        type: DataTypes.TEXT,
        get() {
            const val = this.getDataValue('rooms');
            return val ? (typeof val === 'string' ? JSON.parse(val) : val) : [];
        },
        set(val) {
            this.setDataValue('rooms', typeof val === 'string' ? val : JSON.stringify(val));
        }
    },
    devices: {
        type: DataTypes.TEXT,
        get() {
            const val = this.getDataValue('devices');
            return val ? (typeof val === 'string' ? JSON.parse(val) : val) : [];
        },
        set(val) {
            this.setDataValue('devices', typeof val === 'string' ? val : JSON.stringify(val));
        }
    },
}, {
    timestamps: true,
});

export default Floorplan;