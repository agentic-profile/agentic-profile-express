export function logAxiosResult( axiosResult ) {
    const { config, status } = axiosResult;
    const data = axiosResult.data ?? axiosResult.response?.data;
    const { method, url } = config ?? {};

    const request = { method, url, headers: config.headers, data: config.data, };
    const response = { status, data };

    console.log( "HTTP summary:", JSON.stringify({ request, response },null,4) );
}