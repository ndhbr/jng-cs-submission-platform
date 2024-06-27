const express = require('express')
const fs = require('fs');
const app = express();
const multer = require('multer');
const path = require('path');

const port = 3000;

// Public files
app.use(express.static('public'));

// Configuration
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const publicPath = 'public';
const uploadPath = 's';
const lastUpdatedFilename = '.last_updated';

function checkPassword(groupId, inputPassword) {
    for (const classObj of config.classes) {
        for (const group of classObj.groups) {
            if (group.id === groupId) {
                return group.password === inputPassword;
            }
        }
    }
    return false;
}

function getUploadMiddleware() {
    const storage = multer.diskStorage({
        destination: (req, _, cb) => {
            const { groupId, password } = req.body;

            // Password check
            if (!checkPassword(groupId, password)) {
                return cb(new Error('Ungültiges Passwort. Bitte überprüfe die Schreibweise und die gewählte Gruppe.'));
            }

            // Date check
            const submissionTimestamp = Date.parse(config.submission_date);
            const submissionDate = new Date(submissionTimestamp);
            if (new Date() >= submissionDate) {
                return cb(new Error('Abgabedatum überschritten.'));
            }

            // Create group dir if not exists
            const pathToStore = path.join(__dirname, publicPath, uploadPath, groupId);
            deleteFolderRecursive(pathToStore); // clean
            fs.mkdirSync(pathToStore, { recursive: true });

            // Create last updated file
            fs.writeFileSync(path.join(pathToStore, lastUpdatedFilename), new Date().toJSON());

            cb(null, pathToStore);
        },
        filename: (req, file, cb) => {
            if (req.files.length === 1) {
                cb(null, 'index.html');
            } else {
                cb(null, file.originalname);
            }
        }
    });

    // File filter
    const fileFilter = (_, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.html') {
            return cb(new Error('Nur HTML-Dateien erlaubt.'));
        }
        cb(null, true);
    };

    const upload = multer({ storage: storage, fileFilter: fileFilter });
    return upload.array('files');
};

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

function getSubmissionUrl(groupId) {
    const folder = path.join(__dirname, publicPath, uploadPath, groupId);

    if (fs.existsSync(folder)) {
        return path.join(uploadPath, groupId);
    } else {
        return '';
    }
}

// Get configuration (groups, classes, submission dates, urls)
app.get('/groups', (_, res) => {
    const infos = JSON.parse(JSON.stringify(config));
    const classes = infos.classes;

    classes.forEach(classObj => {
        classObj.groups.forEach(group => {
            // remove pw
            delete group.password;

            // add submission url
            group.url = getSubmissionUrl(group.id);

            // add last updated
            const pathToFile = path.join(__dirname,
                publicPath, uploadPath, group.id, lastUpdatedFilename);
            try {
                const lastUpdatedFile = fs.readFileSync(pathToFile, 'utf-8') ?? '';
                if (lastUpdatedFile.length > 0) {
                    group.last_submission = lastUpdatedFile;
                }
            } catch (_) { }
        });
    });

    res.send(infos);
});

// Upload route
app.post('/upload', (req, res, next) => {
    const upload = getUploadMiddleware();
    upload(req, res, function (err) {
        if (err) {
            return next(err);
        }

        res.redirect('/?msg=Website+erfolgreich+hochgeladen.+:)&type=success');
    });
});

// Error handling middleware
app.use((err, _, res, next) => {
    if (err) {
        res.redirect(`/?msg=${err.message}&type=warning`);
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});