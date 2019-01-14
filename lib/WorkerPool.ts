export class WorkerTask {
    data: any;
    assetName: string | undefined;
    spriteName: string | undefined;
    resolve: (value: any) => void;
}

export class WorkerThread {
    private parentPool: WorkerPool;
    private workerTask: WorkerTask;

    constructor(pool: WorkerPool) {
        this.parentPool = pool;
    }

    run(workerTask: WorkerTask): void {
        this.workerTask = workerTask;
        // create a new web worker
        const worker: Worker = new this.parentPool.AssetWorker();
        worker.addEventListener('message', (message: any) => {
            this.workerTask.resolve(message.data);
            this.workerDone();
        });
        worker.postMessage({
            buffer: workerTask.data.buffer,
            assetName: workerTask.assetName,
            spriteName: workerTask.spriteName
        },[workerTask.data.buffer]);
    }

    workerDone() {
        // we should use a seperate thread to add the worker
        this.parentPool.freeWorkerThread(this);
    }
}

export class WorkerPool {
    private workerQueue: WorkerThread[];
    private taskQueue: WorkerTask[];
    AssetWorker: any;

    constructor(size: number) {
        this.AssetWorker = require("worker-loader?name=assetWorker.js!./assetWorker");
        this.workerQueue = new Array<WorkerThread>();
        this.taskQueue = new Array<WorkerTask>();

        for (let i = 0; i < size; i++) {
            this.workerQueue.push(new WorkerThread(this));
        }
    }

    addWorkerTask(workerTask: WorkerTask): void {
        // get the worker from the front of the queue
        let workerThread = this.workerQueue.shift();
        if (workerThread) {
            workerThread.run(workerTask);
        } else {
            // no free workers
            this.taskQueue.push(workerTask);
        }
    }

    freeWorkerThread(workerThread: WorkerThread): void {
        let workerTask = this.taskQueue.shift();
        if (workerTask) {
            // don't put back in queue, but execute next task
            workerThread.run(workerTask);
        } else {
            this.workerQueue.push(workerThread);
        }
    }
}