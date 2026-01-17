import { Response } from 'express';

export class ApiResponse {
  static success(
    res: Response,
    data: any,
    message: string = 'Success',
    statusCode: number = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: code || 'ERROR',
        message,
        ...(details && { details }),
      },
    });
  }

  static paginated(
    res: Response,
    data: any[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Success'
  ) {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
      message,
    });
  }
}
