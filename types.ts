
export interface Equipment {
    name: string;
    qty: number;
    notes: string;
}

export interface StorageData {
    [id: string]: Equipment;
}

export interface BoxItem {
    [equipmentId: string]: number;
}

export interface Box {
    recipient: string;
    site: string;
    items: BoxItem;
}

export interface BoxesData {
    [id:string]: Box;
}


export interface WasteItem {
    name: string;
    qty: number;
    from: string;
}

export interface WasteData {
    [id: string]: WasteItem;
}


export interface LogEntry {
    time: string;
    user: string;
    action: string;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}
