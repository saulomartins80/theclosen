import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { EnterpriseService } from '../services/EnterpriseService';
import { asyncHandler } from '../../../middlewares/asyncHandler';
import { TYPES } from '../../../core/types';

@injectable()
export class EnterpriseController {
  constructor(
    @inject(TYPES.EnterpriseService)
    private enterpriseService: EnterpriseService
  ) {}

  // Gestão de Empresas
  createCompany = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.enterpriseService.createCompany(req.body);
    res.status(201).json({ success: true, data: company });
  });

  getCompanies = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const companies = await this.enterpriseService.getCompaniesByUser(userId);
    res.json({ success: true, data: companies });
  });

  updateCompany = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = await this.enterpriseService.updateCompany(id, req.body);
    res.json({ success: true, data: company });
  });

  deleteCompany = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.enterpriseService.deleteCompany(id);
    res.json({ success: true, message: 'Empresa excluída com sucesso' });
  });

  // Gestão de Funcionários
  createEmployee = asyncHandler(async (req: Request, res: Response) => {
    const employee = await this.enterpriseService.createEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  });

  getEmployees = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const employees = await this.enterpriseService.getEmployeesByCompany(
      companyId
    );
    res.json({ success: true, data: employees });
  });

  updateEmployee = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const employee = await this.enterpriseService.updateEmployee(id, req.body);
    res.json({ success: true, data: employee });
  });

  deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.enterpriseService.deleteEmployee(id);
    res.json({ success: true, message: 'Funcionário excluído com sucesso' });
  });

  // Gestão de Projetos
  createProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await this.enterpriseService.createProject(req.body);
    res.status(201).json({ success: true, data: project });
  });

  getProjects = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const projects = await this.enterpriseService.getProjectsByCompany(
      companyId
    );
    res.json({ success: true, data: projects });
  });

  updateProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await this.enterpriseService.updateProject(id, req.body);
    res.json({ success: true, data: project });
  });

  deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.enterpriseService.deleteProject(id);
    res.json({ success: true, message: 'Projeto excluído com sucesso' });
  });

  // Relatórios e Dashboard
  getCompanyReport = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;
    const report = await this.enterpriseService.generateCompanyReport(
      companyId,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data: report });
  });

  getFinancialReport = asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { period } = req.query;
    const report = await this.enterpriseService.generateFinancialReport(
      companyId,
      period as string
    );
    res.json({ success: true, data: report });
  });

  getEnterpriseDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const dashboard = await this.enterpriseService.getEnterpriseDashboard(
      userId
    );
    res.json({ success: true, data: dashboard });
  });
}