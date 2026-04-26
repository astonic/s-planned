Build a Fluent UI v9 Dialog form for S-Planned: $ARGUMENTS

Follow docs/design/design-guidelines.md §6 (Forms & Dialogs) exactly.

## Checklist

1. **Determine fields** from $ARGUMENTS — note which are required vs optional.

2. **Create Zod schema** co-located with the form component:
   ```tsx
   import { z } from 'zod'
   export const formSchema = z.object({ title: z.string().min(1, 'Required'), ... })
   export type FormValues = z.infer<typeof formSchema>
   ```

3. **Wire react-hook-form**:
   ```tsx
   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   const form = useForm<FormValues>({ resolver: zodResolver(formSchema) })
   ```

4. **Dialog structure** — use this exact shell:
   ```tsx
   import { Dialog, DialogTrigger, DialogSurface, DialogBody,
            DialogTitle, DialogContent, DialogActions, Field,
            Input, Button } from '@fluentui/react-components'

   <Dialog>
     <DialogTrigger disableButtonEnhancement>
       <Button appearance="primary">Open</Button>
     </DialogTrigger>
     <DialogSurface style={{ width: 480 }}>  {/* 480px default, 640px for complex forms */}
       <form onSubmit={form.handleSubmit(onSubmit)}>
         <DialogBody>
           <DialogTitle>Title</DialogTitle>
           <DialogContent>
             {/* Fields here */}
           </DialogContent>
           <DialogActions>
             <DialogTrigger disableButtonEnhancement>
               <Button appearance="secondary">Cancel</Button>
             </DialogTrigger>
             <Button appearance="primary" type="submit" disabled={isPending}>
               {isPending ? <Spinner size="tiny" /> : 'Save'}
             </Button>
           </DialogActions>
         </DialogBody>
       </form>
     </DialogSurface>
   </Dialog>
   ```

5. **Every input must be wrapped in `Field`**:
   ```tsx
   <Field
     label="Title"
     required
     validationMessage={form.formState.errors.title?.message}
     validationState={form.formState.errors.title ? 'error' : 'none'}
   >
     <Input {...form.register('title')} />
   </Field>
   ```
   Field types: `Input`, `Textarea`, `Select`, `Combobox`, `SpinButton`, `DatePicker`

6. **Submit handler** calls the appropriate server action:
   ```tsx
   const [isPending, startTransition] = useTransition()
   const onSubmit = (values: FormValues) => {
     startTransition(async () => {
       const result = await serverAction(values)
       if (result.error) {
         dispatchToast(<Toast><ToastTitle>{result.error}</ToastTitle></Toast>, { intent: 'error' })
       } else {
         dispatchToast(<Toast><ToastTitle>Saved successfully</ToastTitle></Toast>, { intent: 'success' })
         // close dialog, invalidate cache, etc.
       }
     })
   }
   ```

7. **Toast feedback** — always dispatch a toast on success and on error. Use `useToastController`
   from `@fluentui/react-components`. Toast position: `top-end`.

8. **AuditEvent** — ensure the server action creates an AuditEvent for the mutation (per CLAUDE.md).

9. **TenantContext** — ensure the server action wraps its Prisma calls in TenantContext (per CLAUDE.md).

10. **Verify**: form submits, shows validation errors inline, shows spinner during submit, shows
    toast on completion, closes dialog on success.
