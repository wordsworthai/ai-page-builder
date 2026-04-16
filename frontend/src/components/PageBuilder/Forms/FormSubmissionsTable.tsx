import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  styled,
} from '@mui/material';
import { FormGroupRead } from '@/client';
import { format } from 'date-fns';

interface FormSubmissionsTableProps {
  formGroup: FormGroupRead;
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'auto',
  backgroundColor: '#FFFFFF',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#F5F3FF',
  '& th': {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#6B46C1',
    borderBottom: '2px solid #E9D8FD',
    padding: theme.spacing(2),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#FAFAFA',
  },
  '&:hover': {
    backgroundColor: '#F5F3FF',
    cursor: 'pointer',
  },
  transition: 'background-color 0.2s ease',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: '0.875rem',
  color: '#333333',
  padding: theme.spacing(2),
  borderBottom: '1px solid #E5E7EB',
  minWidth: 120,
  whiteSpace: 'nowrap',
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8, 2),
  color: '#9CA3AF',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
}));

const FormSubmissionsTable: React.FC<FormSubmissionsTableProps> = ({ formGroup }) => {
  if (!formGroup.submissions || formGroup.submissions.length === 0) {
    return (
      <EmptyState>
        <Typography variant="h6" gutterBottom>
          No submissions yet
        </Typography>
        <Typography variant="body2">
          Submissions will appear here once visitors fill out this form.
        </Typography>
      </EmptyState>
    );
  }

  // Function to format cell values
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <StyledTableContainer>
      <Table sx={{ minWidth: 800 }}>
        <StyledTableHead>
          <TableRow>
            <TableCell>Submitted At</TableCell>
            <TableCell>Domain</TableCell>
            <TableCell>Page</TableCell>
            {formGroup.field_names.map((fieldName) => (
              <TableCell key={fieldName}>
                {fieldName.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </TableCell>
            ))}
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {formGroup.submissions.map((submission) => (
            <StyledTableRow key={submission.submission_id}>
              <StyledTableCell>
                {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
              </StyledTableCell>
              <StyledTableCell title={submission.domain}>
                <Chip
                  label={submission.domain}
                  size="small"
                  sx={{
                    backgroundColor: '#E9D8FD',
                    color: '#6B46C1',
                    fontWeight: 500,
                    maxWidth: 'none',
                    '& .MuiChip-label': { overflow: 'visible', whiteSpace: 'nowrap' },
                  }}
                />
              </StyledTableCell>
              <StyledTableCell>{submission.page_path}</StyledTableCell>
              {formGroup.field_names.map((fieldName) => (
                <StyledTableCell key={fieldName} title={formatCellValue(submission.data[fieldName])}>
                  {formatCellValue(submission.data[fieldName])}
                </StyledTableCell>
              ))}
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

export default FormSubmissionsTable;