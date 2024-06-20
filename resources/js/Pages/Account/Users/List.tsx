'use client';

import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Button,
  Container,
  Flex,
  Group,
  Modal,
  Paper,
  PaperProps,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import _first from 'lodash/first';
import { Head, Link, router } from '@inertiajs/react';
import { useThrottledCallback, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableProps, DataTableSortStatus } from 'mantine-datatable';
import { IconDotsVertical, IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { PageHeader } from '@/Components';
import { AuthenticatedLayout } from '@/Layouts';
import { PageProps, User } from '@/types';

type UsersProps = {
  users: any;
} & PageProps;

const items = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Users', href: '#' },
].map((item, index) => (
  <Anchor component={Link} href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const PAPER_PROPS: PaperProps = {
  p: 'md',
  shadow: 'md',
  radius: 'md',
};

export default function List({ auth, users }: UsersProps) {
  const theme = useMantineTheme();
  const [userActive, setUserActive] = useState<User>();
  const [fetching, setFetching] = useState<boolean>(false);
  const [isOpen, { open: onOpen, close: onClose }] = useDisclosure(false);
  const [search, setSearch] = useState<string>('');
  const [selectedRecords, setSelectedRecords] = useState<User[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<User>>({
    columnAccessor: 'user',
    direction: 'asc',
  });

  const RECORD_PAGINATOR = [5, 10, 20, 50];

  router.on('start', () => setFetching(() => true));
  router.on('finish', () => setFetching(() => false));

  const onQueryTable = (queryKey: string, queryValue: string) => {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set(queryKey, queryValue.toString());

    if (queryKey === 'per_page') queryParams.set('page', '1');

    const payload = Object.fromEntries(queryParams);
    router.get(route('user.index'), payload, { preserveState: true });
  };

  const onSortStatusChange = ({ columnAccessor, direction }: DataTableSortStatus<User>) => {
    onQueryTable('sort', direction === 'asc' ? columnAccessor : `-${columnAccessor}`);
    setSortStatus(() => ({ columnAccessor, direction }));
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setSearch(queryParams.get('search') ?? '');
  }, []);

  const throttledSearch = useThrottledCallback(search => {
    onQueryTable('search', search);
  }, 3000);

  const onDeleteAccount = () => {
    if (!userActive) {
      return notifications.show({
        title: 'Failed!',
        message: 'Something went wrong, Try again!',
      });
    }

    router.delete(route('user.destroy', userActive.id), {
      onSuccess: () => {
        onClose();
        notifications.show({
          title: 'Success!',
          message: 'User permanently deleted successfully',
        });
      },
      onError: error => {
        notifications.show({ title: 'Failed!', message: error.message });
      },
    });
  };

  const columns: DataTableProps<User>['columns'] = [
    {
      accessor: 'firstname',
      title: 'User',
      render: (user: User) => {
        return (
          <Flex component={UnstyledButton} gap="xs" align="center">
            <Avatar
              variant="filled"
              radius="xl"
              size="md"
              src={user.avatar}
              alt={`${user.firstname} ${user.lastname}`}
              color={theme.primaryColor}
            >
              {_first(user.firstname)} {_first(user.lastname)}
            </Avatar>
            <Stack gap={0}>
              <Text fz="sm" fw={600}>
                {user.firstname} {user.lastname}
              </Text>
              <Text fz="xs">{user.email}</Text>
            </Stack>
          </Flex>
        );
      },
      sortable: true,
      filter: (
        <TextInput
          label="Users"
          description="Show all users in the system"
          placeholder="Search users..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => {
            setSearch(e.currentTarget.value);
            throttledSearch(e.currentTarget.value);
          }}
        />
      ),
    },
    {
      accessor: 'Status',
      render: (user: User) => (
        <Badge
          color={user.email_verified_at ? 'green.8' : 'red'}
          variant="filled"
          size="sm"
          radius="sm"
        >
          {user.email_verified_at ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      accessor: 'created_at',
      sortable: true,
      render: (user: User) => (
        <Text fz="sm">{dayjs(new Date(user.created_at)).format('MMM D, YYYY')}</Text>
      ),
    },
    {
      accessor: 'updated_at',
      sortable: true,
      render: (user: User) => (
        <Text fz="sm">{dayjs(new Date(user.updated_at)).format('MMM D, YYYY')}</Text>
      ),
    },
    {
      accessor: '',
      title: 'Actions',
      render: (user: any) => (
        <Group gap="sm">
          <Button
            component={Link}
            href={`/users/${user.id}/edit`}
            variant="filled"
            size="xs"
            leftSection={<IconEdit size={16} />}
          >
            Edit
          </Button>
          <Button
            onClick={() => {
              setUserActive(() => user);
              onOpen();
            }}
            variant="filled"
            size="xs"
            color="red"
            leftSection={<IconTrash size={16} />}
          >
            Delete
          </Button>
        </Group>
      ),
    },
  ];

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Users | Account" />

      <Modal opened={isOpen} onClose={onClose} title="Delete Account" centered>
        <Stack>
          <Text fw={600}>Are You sure you want to delete this user?</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Button loading={fetching} onClick={onDeleteAccount} variant="filled">
              Delete
            </Button>
            <Button disabled={fetching} onClick={onClose} variant="outline">
              Cancel
            </Button>
          </SimpleGrid>
        </Stack>
      </Modal>

      <Container fluid>
        <Stack gap="lg">
          <PageHeader
            user={auth.user}
            title="Users"
            breadcrumbItems={items}
            withActions={
              <Button component={Link} href={'/users/create'} leftSection={<IconPlus size={18} />}>
                New User
              </Button>
            }
          />
          <Paper {...PAPER_PROPS}>
            <Group justify="space-between" mb="md">
              <Text fz="lg" fw={600}>
                Users
              </Text>
              <ActionIcon>
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Group>
            <DataTable
              minHeight={200}
              verticalSpacing="xs"
              striped
              highlightOnHover
              columns={columns}
              records={users.data}
              selectedRecords={selectedRecords}
              onSelectedRecordsChange={setSelectedRecords}
              totalRecords={users.total}
              recordsPerPage={users.per_page}
              page={users.current_page}
              onPageChange={p => onQueryTable('page', p.toString())}
              recordsPerPageOptions={RECORD_PAGINATOR}
              onRecordsPerPageChange={p => onQueryTable('per_page', p.toString())}
              sortStatus={sortStatus}
              onSortStatusChange={onSortStatusChange}
              fetching={fetching}
            />
          </Paper>
        </Stack>
      </Container>
    </AuthenticatedLayout>
  );
}
