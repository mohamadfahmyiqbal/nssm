import Setting from '../models/Setting.js';

export const saveSetting = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ success: false, message: 'Key is required' });
        }

        // Upsert logically (find and update, or create)
        let setting = await Setting.findOne({ where: { key } });
        const valueToSave = typeof value === 'object' ? JSON.stringify(value) : value;
        
        if (setting) {
            setting.value = valueToSave;
            await setting.save();
        } else {
            try {
                setting = await Setting.create({
                    key,
                    value: valueToSave
                });
            } catch (createError) {
                if (createError.name === 'SequelizeUniqueConstraintError') {
                    setting = await Setting.findOne({ where: { key } });
                    if (setting) {
                        setting.value = valueToSave;
                        await setting.save();
                    } else {
                        throw createError;
                    }
                } else {
                    throw createError;
                }
            }
        }

        res.status(200).json({ success: true, data: setting });
    } catch (error) {
        console.error('Error saving setting:', error);
        res.status(500).json({ success: false, error: 'Failed to save setting' });
    }
};

export const getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Setting.findOne({ where: { key } });

        if (!setting) {
            return res.status(200).json({ success: true, data: { key, value: null } });
        }

        let parsedValue = setting.value;
        try {
            parsedValue = JSON.parse(setting.value);
        } catch (e) {
            // value is a simple string, do nothing
        }

        res.status(200).json({ success: true, data: { ...setting.toJSON(), value: parsedValue } });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch setting' });
    }
};
