

export function logAxiosResult( axiosResult ) {
    const { data, config, status } = axiosResult;
    const { method, url } = config ?? {};

    const request = { method, url, headers: config.headers, data: config.data, };
    const response = { status, data };

    console.log( "HTTP summary:", JSON.stringify({ request, response },null,4) );
}