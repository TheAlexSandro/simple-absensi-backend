export default {
  "400": {
    BAD_REQUEST: {
      code: "BAD_REQUEST",
      message: "Something went wrong",
    },
    UNKNOWN_ERROR: {
      code: "UNKNOWN_ERROR",
    },
    USER_FOUND: {
      code: "USER_FOUND",
      message: "Pengguna sudah ada."
    }
  },
  "404": {
    EMPTY_PARAMETER: {
      code: "EMPTY_PARAMETER",
      message: "The required parameter cannot be empty: {param}.",
    },
    INVALID_VALUE_IN_PARAMETER: {
      code: "INVALID_VALUE_IN_PARAMETER",
      message: "Invalid value in {param}, only accepted: {accept}",
    },
    USER_NOT_FOUND: {
      code: "USER_NOT_FOUND",
      message: "User not found.",
    },
  },
  "401": {
    UNAUTHORIZED_ACCESS: {
      code: "UNAUTHORIZED_ACCESS",
      message: "Invalid password.",
    },
    ACCESS_DENIED: {
      code: "ACCESS_DENIED",
      message: "Access Denied.",
    },
  },
  "429": {
    TOO_MANY_REQUEST: {
      code: "TOO_MANY_REQUEST",
      message: "Too many request, retry after {duration} seconds.",
    },
  },
  "403": {
    FORBIDDEN_RESOLVE: {
      code: "FORBIDDEN_RESOLVE",
      message: "What are you doing?",
    },
  },
  "413": {
    FILE_TOO_LARGE: {
      code: "FILE_TOO_LARGE",
      message: "The maximum file size is 500 MB."
    }
  }
};