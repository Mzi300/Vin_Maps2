const ftp = require("basic-ftp");

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log("Connecting to FTP...");
        await client.access({
            host: "ftp.livenetstudios.co.za",
            user: "livenets",
            password: "Livenet@2026",
            secure: false
        });
        
        console.log("Navigating to maps.livenetstudios.co.za...");
        await client.ensureDir("maps.livenetstudios.co.za");
        
        console.log("Clearing old files to prevent conflicts...");
        await client.clearWorkingDir();
        
        console.log("Uploading fresh dist bundle...");
        await client.uploadFromDir("dist");
        
        console.log("Deployment Complete!");
    }
    catch(err) {
        console.log("Deployment Failed:", err);
    }
    client.close();
}

deploy();
