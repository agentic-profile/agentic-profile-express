
export function createTimer(name:string) {
    let start = Date.now();
    let recent = start;

    return {
        elapsed: function( label:string, ...props:any[] ) {
            const now = Date.now();
            console.log(`Timer(${name}:${label}) ${now-recent}ms, ${now-start}ms total`, ...props);
            recent = now;
        }
    };
}