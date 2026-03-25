
import PQueue from 'p-queue';


const queue = new PQueue({ intervalCap: 1, interval: 1000 });

const someTask =  () => {
    // Simulate an async task
    console.log('Task executed at:', new Date().toISOString());
}

const main = async () => {

    // Add many tasks
    for (let index = 0; index < 10; index++) {
        queue.add(() => someTask());
    }

    // await queue.onRateLimit();
}

main();