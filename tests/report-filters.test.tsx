// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {ReportFilters} from '../components/report-filters';
import {parseReportFilters} from '../validation/reports';
afterEach(cleanup);
it('submits several checked options and clears dependent selections',()=>{render(<ReportFilters filters={parseReportFilters({})} currencies={[{id:'omr',code:'OMR',decimalPlaces:3},{id:'inr',code:'INR',decimalPlaces:2}]} accounts={[]} categories={[]}/>);fireEvent.click(screen.getByLabelText('Currency'));fireEvent.click(screen.getByRole('checkbox',{name:'OMR'}));fireEvent.click(screen.getByRole('checkbox',{name:'INR'}));const form=screen.getByRole('button',{name:'Apply filters'}).closest('form')!;expect(new FormData(form).get('currencyId')).toBe('omr,inr');expect(screen.getByRole('link',{name:'Reset filters'}).getAttribute('href')).toBe('/reports');fireEvent.click(screen.getAllByRole('button',{name:'Clear selection'})[0]);expect(new FormData(form).get('currencyId')).toBe('')});
