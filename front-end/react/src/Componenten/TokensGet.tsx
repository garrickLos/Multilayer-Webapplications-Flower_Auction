export function getBearerToken() {
    return sessionStorage.getItem("token");
}

export function getRefreshToken(){
    return sessionStorage.getItem("refreshToken")
}