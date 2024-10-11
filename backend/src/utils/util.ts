import fs from 'fs';
import path from 'path';

export const ensureDirectoryExists = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

export const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
};


export const uploadDirectory = path.resolve(__dirname, '../../uploads');
export const processedDirectory = path.resolve(__dirname, '../../processed');

ensureDirectoryExists(uploadDirectory);
ensureDirectoryExists(processedDirectory);